import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import LaserScan from './LaserScan';

const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
};

const LANDMARK_CONNECTIONS = {
    jawline: Array.from({ length: 16 }, (_, i) => [i, i + 1]),
    leftEyebrow: Array.from({ length: 4 }, (_, i) => [17 + i, 18 + i]),
    rightEyebrow: Array.from({ length: 4 }, (_, i) => [22 + i, 23 + i]),
    noseBridge: Array.from({ length: 3 }, (_, i) => [27 + i, 28 + i]),
    noseBottom: Array.from({ length: 4 }, (_, i) => [31 + i, 32 + i]),
    leftEye: [...Array.from({ length: 5 }, (_, i) => [36 + i, 37 + i]), [41, 36]],
    rightEye: [...Array.from({ length: 5 }, (_, i) => [42 + i, 43 + i]), [47, 42]],
    outerLip: [...Array.from({ length: 11 }, (_, i) => [48 + i, 49 + i]), [59, 48]],
    innerLip: [...Array.from({ length: 7 }, (_, i) => [60 + i, 61 + i]), [67, 60]],
};

const FaceCapture = ({ onCapture }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const liveCanvasRef = useRef(null);
    const animFrameRef = useRef(null);
    const scanAnimRef = useRef(null);
    const [image, setImage] = useState(null);
    const [modelsReady, setModelsReady] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [scanPhase, setScanPhase] = useState('idle');
    const [scanProgress, setScanProgress] = useState(0);
    const [scanMessage, setScanMessage] = useState('');

    useEffect(() => {
        const checkModels = () => {
            if (faceapi.nets.ssdMobilenetv1.isLoaded &&
                faceapi.nets.faceLandmark68Net.isLoaded) {
                setModelsReady(true);
            } else {
                setTimeout(checkModels, 500);
            }
        };
        checkModels();
    }, []);

    // Live detection
    useEffect(() => {
        if (!modelsReady || image) return;
        let running = true;

        const detectLive = async () => {
            if (!running || !webcamRef.current?.video || !liveCanvasRef.current) return;
            const video = webcamRef.current.video;
            const canvas = liveCanvasRef.current;
            if (video.readyState !== 4) { animFrameRef.current = requestAnimationFrame(detectLive); return; }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            try {
                const detection = await faceapi.detectSingleFace(video).withFaceLandmarks();
                if (detection) {
                    setFaceDetected(true);
                    const positions = detection.landmarks.positions;
                    positions.forEach((point, i) => {
                        const pulse = Math.sin(Date.now() * 0.008 + i * 0.2) * 0.5 + 0.5;
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, 1.5 + pulse * 0.5, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + pulse * 0.3})`;
                        ctx.fill();
                    });
                    const box = detection.detection.box;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(box.x - 5, box.y - 5, box.width + 10, box.height + 10);
                    ctx.setLineDash([]);
                } else {
                    setFaceDetected(false);
                }
            } catch (err) { }

            if (running) animFrameRef.current = requestAnimationFrame(detectLive);
        };

        const timeout = setTimeout(detectLive, 800);
        return () => {
            running = false;
            clearTimeout(timeout);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [modelsReady, image]);

    // Post-capture scan
    useEffect(() => {
        if (!image || !modelsReady || !canvasRef.current) return;

        let cancelled = false;
        setScanPhase('scanning');
        setScanProgress(0);
        setScanMessage('INITIALIZING SCAN...');

        const runScanAnimation = async () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            const img = await new Promise((resolve, reject) => {
                const i = new Image();
                i.crossOrigin = "anonymous";
                i.onload = () => resolve(i);
                i.onerror = reject;
                i.src = image;
            });

            canvas.width = img.width;
            canvas.height = img.height;

            const detection = await faceapi.detectSingleFace(img).withFaceLandmarks();
            if (!detection || cancelled) {
                setScanMessage('NO FACE DETECTED — RETAKE');
                setScanPhase('idle');
                return;
            }

            const positions = detection.landmarks.positions;
            const box = detection.detection.box;
            const totalPoints = positions.length;
            const totalFrames = 180;
            let frame = 0;

            const messages = [
                { at: 0, text: 'MAPPING FACIAL GEOMETRY...' },
                { at: 20, text: 'DETECTING JAWLINE CONTOUR...' },
                { at: 35, text: 'SCANNING EYE REGIONS...' },
                { at: 50, text: 'ANALYZING NOSE BRIDGE...' },
                { at: 65, text: 'MAPPING LIP CONTOURS...' },
                { at: 80, text: 'CALCULATING FACE DESCRIPTOR...' },
                { at: 95, text: 'BIOMETRIC DATA CAPTURED ✓' },
            ];

            const animate = () => {
                if (cancelled) return;
                frame++;
                const progress = Math.min((frame / totalFrames) * 100, 100);
                setScanProgress(progress);
                const currentMsg = [...messages].reverse().find(m => progress >= m.at);
                if (currentMsg) setScanMessage(currentMsg.text);

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const revealCount = Math.floor((progress / 100) * totalPoints);

                // Grid (white)
                const gridOpacity = Math.min(progress / 30, 0.12);
                ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity})`;
                ctx.lineWidth = 0.3;
                const gridSize = 20;
                const time = frame * 0.02;
                for (let x = box.x - 30; x < box.x + box.width + 30; x += gridSize) {
                    ctx.beginPath(); ctx.moveTo(x, box.y - 30);
                    ctx.lineTo(x + Math.sin(time + x * 0.01) * 2, box.y + box.height + 30); ctx.stroke();
                }
                for (let y = box.y - 30; y < box.y + box.height + 30; y += gridSize) {
                    ctx.beginPath(); ctx.moveTo(box.x - 30, y);
                    ctx.lineTo(box.x + box.width + 30, y + Math.cos(time + y * 0.01) * 2); ctx.stroke();
                }

                // Corner brackets (white)
                const bx = box.x - 15, by = box.y - 15;
                const bw = box.width + 30, bh = box.height + 30;
                const cornerLen = 25;
                const boxPulse = Math.sin(frame * 0.05) * 0.3 + 0.7;
                ctx.strokeStyle = `rgba(255, 255, 255, ${boxPulse * 0.8})`;
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.moveTo(bx, by + cornerLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerLen, by); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(bx + bw - cornerLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cornerLen); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(bx, by + bh - cornerLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cornerLen, by + bh); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(bx + bw - cornerLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cornerLen); ctx.stroke();
                ctx.shadowBlur = 0;

                ctx.strokeStyle = `rgba(255, 255, 255, ${boxPulse * 0.2})`;
                ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.strokeRect(bx, by, bw, bh); ctx.setLineDash([]);

                // Scan line (white)
                if (progress < 90) {
                    const scanY = by + ((frame * 3) % bh);
                    const gradient = ctx.createLinearGradient(bx, scanY - 2, bx, scanY + 2);
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.fillStyle = gradient; ctx.fillRect(bx, scanY - 2, bw, 4);
                    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 15;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'; ctx.fillRect(bx, scanY - 1, bw, 2);
                    ctx.shadowBlur = 0;
                }

                // Lines (white)
                Object.entries(LANDMARK_CONNECTIONS).forEach(([region, connections]) => {
                    connections.forEach(([from, to]) => {
                        if (from < revealCount && to < revealCount) {
                            const p1 = positions[from], p2 = positions[to];
                            const lineProgress = Math.min((revealCount - Math.max(from, to)) / 3, 1);
                            ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 4;
                            ctx.beginPath(); ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p1.x + (p2.x - p1.x) * lineProgress, p1.y + (p2.y - p1.y) * lineProgress);
                            ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + lineProgress * 0.5})`;
                            ctx.lineWidth = 1.2; ctx.stroke(); ctx.shadowBlur = 0;
                        }
                    });
                });

                // Dots (white)
                positions.forEach((point, i) => {
                    if (i >= revealCount) return;
                    const pulse = Math.sin(frame * 0.08 + i * 0.4) * 0.5 + 0.5;
                    const age = (revealCount - i) / totalPoints;
                    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;
                    ctx.beginPath(); ctx.arc(point.x, point.y, 2.5 + pulse * 1.2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + pulse * 0.2})`; ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.beginPath(); ctx.arc(point.x, point.y, 1.8, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + age * 0.4})`; ctx.fill();
                    ctx.beginPath(); ctx.arc(point.x, point.y, 0.7, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff'; ctx.fill();
                });

                // Face outline (white)
                if (progress > 25) {
                    const shapeOpacity = Math.min((progress - 25) / 30, 0.5);
                    ctx.beginPath();
                    const jawEnd = Math.min(revealCount, 17);
                    if (jawEnd > 0) {
                        ctx.moveTo(positions[0].x, positions[0].y);
                        for (let i = 1; i < jawEnd; i++) ctx.lineTo(positions[i].x, positions[i].y);
                    }
                    if (revealCount > 26) {
                        const fo = 40;
                        ctx.lineTo(positions[26].x, positions[26].y - fo);
                        ctx.lineTo(positions[24].x, positions[24].y - fo - 10);
                        ctx.lineTo(positions[21].x, positions[21].y - fo - 10);
                        ctx.lineTo(positions[19].x, positions[19].y - fo);
                        ctx.lineTo(positions[17].x, positions[17].y - fo);
                        ctx.lineTo(positions[0].x, positions[0].y);
                    }
                    ctx.strokeStyle = `rgba(255, 255, 255, ${shapeOpacity})`;
                    ctx.lineWidth = 1.5; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 12;
                    ctx.stroke(); ctx.shadowBlur = 0;
                }

                // Data text (white)
                ctx.font = '10px monospace';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fillText(`NODES: ${revealCount}/${totalPoints}`, bx, by - 8);
                if (progress > 30) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.fillText(`CONFIDENCE: ${(98.2 + Math.random() * 1.5).toFixed(1)}%`, bx + bw - 120, by - 8);
                }

                // Measurement lines (white)
                if (progress > 50) {
                    const measOpacity = Math.min((progress - 50) / 20, 0.35);
                    drawMeasurementLine(ctx, positions[36], positions[45], measOpacity);
                    if (revealCount > 55) drawMeasurementLine(ctx, positions[30], positions[8], measOpacity);
                }

                if (progress < 100) {
                    scanAnimRef.current = requestAnimationFrame(animate);
                } else {
                    setScanPhase('complete');
                }
            };

            scanAnimRef.current = requestAnimationFrame(animate);
        };

        runScanAnimation();
        return () => {
            cancelled = true;
            if (scanAnimRef.current) cancelAnimationFrame(scanAnimRef.current);
        };
    }, [image, modelsReady]);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImage(imageSrc);
        onCapture(imageSrc);
    }, [webcamRef, onCapture]);

    const retake = () => {
        setImage(null);
        setScanPhase('idle');
        setScanProgress(0);
        setFaceDetected(false);
        onCapture(null);
    };

    return (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 shadow-lg">
            {!image && <LaserScan />}
            {image ? (
                <div className="relative">
                    <img src={image} alt="Captured" className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" />
                    <div className="absolute top-3 left-3 z-20">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                            <div className={`w-2 h-2 rounded-full ${scanPhase === 'complete' ? 'bg-green-400' : 'bg-white'} animate-pulse`}></div>
                            <span className="text-[9px] font-mono tracking-widest text-white/80 uppercase">{scanMessage}</span>
                        </div>
                    </div>
                    <div className="absolute bottom-14 left-4 right-4 z-20">
                        <div className="h-[3px] bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-100 ${scanPhase === 'complete' ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-white/70'}`}
                                style={{ width: `${scanProgress}%` }}></div>
                        </div>
                    </div>
                </div>
            ) : (
                <Webcam audio={false} height={720} ref={webcamRef} screenshotFormat="image/jpeg" width={1280}
                    videoConstraints={videoConstraints} className="w-full h-full object-cover opacity-80" />
            )}

            {!image && <canvas ref={liveCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" />}

            {!image && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]'} animate-pulse`}></div>
                    <span className="text-[9px] font-mono tracking-widest text-white/60 uppercase">
                        {faceDetected ? 'FACE_LOCKED' : 'SEARCHING'}
                    </span>
                </div>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                {image ? (
                    <button onClick={retake}
                        className="px-6 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full font-mono text-xs uppercase tracking-widest backdrop-blur-md transition-colors shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                        Retake Scan
                    </button>
                ) : (
                    <button onClick={capture} disabled={!faceDetected}
                        className={`px-6 py-2 rounded-full font-mono text-xs uppercase tracking-widest backdrop-blur-md transition-all border border-white/20 ${faceDetected ? 'bg-blue-500/80 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                        Capture Face
                    </button>
                )}
            </div>
        </div>
    );
};

function drawMeasurementLine(ctx, p1, p2, opacity) {
    const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    ctx.setLineDash([]);
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const tickLen = 5;
    [p1, p2].forEach(p => {
        ctx.beginPath();
        ctx.moveTo(p.x + Math.sin(angle) * tickLen, p.y - Math.cos(angle) * tickLen);
        ctx.lineTo(p.x - Math.sin(angle) * tickLen, p.y + Math.cos(angle) * tickLen);
        ctx.stroke();
    });
    const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
    ctx.font = '8px monospace';
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity + 0.15})`;
    ctx.fillText(`${dist.toFixed(1)}px`, midX + 5, midY - 5);
}

export default FaceCapture;
