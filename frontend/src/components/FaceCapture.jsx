import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Clock, X } from 'lucide-react';

const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
};

const API = 'http://localhost:5000/api/attendance';

const FaceCapture = ({ onClose }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);
    const scanIntervalRef = useRef(null);

    const [modelsReady, setModelsReady] = useState(false);
    const [status, setStatus] = useState('loading');   // loading | scanning | recognizing | success | already | error
    const [recognizedName, setRecognizedName] = useState('');
    const [recognizedBox, setRecognizedBox] = useState(null);
    const [attendanceTime, setAttendanceTime] = useState('');
    const [attendanceStatus, setAttendanceStatus] = useState('');
    const [message, setMessage] = useState('');
    const [confidence, setConfidence] = useState('');
    const isProcessingRef = useRef(false);
    const cooldownRef = useRef(false);

    // Check if models are loaded
    useEffect(() => {
        const checkModels = () => {
            if (faceapi.nets.ssdMobilenetv1.isLoaded &&
                faceapi.nets.faceLandmark68Net.isLoaded &&
                faceapi.nets.faceRecognitionNet.isLoaded) {
                setModelsReady(true);
                setStatus('scanning');
            } else {
                setTimeout(checkModels, 500);
            }
        };
        checkModels();
    }, []);

    // Draw overlay on canvas
    const drawOverlay = useCallback((ctx, w, h, box, name, phase) => {
        ctx.clearRect(0, 0, w, h);

        // Scanning grid lines (subtle)
        if (phase === 'scanning') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 0.5;
            for (let x = 0; x < w; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }
            for (let y = 0; y < h; y += 40) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            }
        }

        if (box) {
            const padding = 20;
            const bx = box.x - padding;
            const by = box.y - padding;
            const bw = box.width + padding * 2;
            const bh = box.height + padding * 2;
            const cornerLen = 30;
            const isRecognized = name && name.length > 0;
            const color = isRecognized ? '74, 222, 128' : '255, 255, 255';
            const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;

            // Corner brackets
            ctx.strokeStyle = `rgba(${color}, ${pulse * 0.9})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = `rgba(${color}, 0.6)`;
            ctx.shadowBlur = 15;

            // Top-left
            ctx.beginPath(); ctx.moveTo(bx, by + cornerLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerLen, by); ctx.stroke();
            // Top-right
            ctx.beginPath(); ctx.moveTo(bx + bw - cornerLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cornerLen); ctx.stroke();
            // Bottom-left
            ctx.beginPath(); ctx.moveTo(bx, by + bh - cornerLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cornerLen, by + bh); ctx.stroke();
            // Bottom-right
            ctx.beginPath(); ctx.moveTo(bx + bw - cornerLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cornerLen); ctx.stroke();
            ctx.shadowBlur = 0;

            // Dashed outline
            ctx.strokeStyle = `rgba(${color}, ${pulse * 0.25})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 6]);
            ctx.strokeRect(bx, by, bw, bh);
            ctx.setLineDash([]);

            // Scan line
            if (!isRecognized) {
                const scanY = by + ((Date.now() * 0.15) % bh);
                const gradient = ctx.createLinearGradient(bx, scanY - 3, bx, scanY + 3);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(bx, scanY - 3, bw, 6);
            }

            // Name label
            if (isRecognized) {
                const labelText = name.toUpperCase();
                ctx.font = 'bold 16px monospace';
                const textWidth = ctx.measureText(labelText).width;
                const labelW = textWidth + 24;
                const labelH = 32;
                const labelX = bx + (bw - labelW) / 2;
                const labelY = by - labelH - 8;

                // Label background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.beginPath();
                ctx.roundRect(labelX, labelY, labelW, labelH, 6);
                ctx.fill();
                ctx.strokeStyle = `rgba(${color}, 0.6)`;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Name text
                ctx.fillStyle = `rgba(${color}, 1)`;
                ctx.textAlign = 'center';
                ctx.fillText(labelText, bx + bw / 2, labelY + 21);
                ctx.textAlign = 'start';
            }
        }
    }, []);

    // Continuous face detection + recognition loop
    useEffect(() => {
        if (!modelsReady || status === 'success' || status === 'already') return;

        let running = true;

        const detectAndRecognize = async () => {
            if (!running || !webcamRef.current?.video || !canvasRef.current) return;
            const video = webcamRef.current.video;
            const canvas = canvasRef.current;

            if (video.readyState !== 4) {
                animFrameRef.current = requestAnimationFrame(detectAndRecognize);
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            try {
                const detection = await faceapi.detectSingleFace(video)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    const box = detection.detection.box;
                    setRecognizedBox({ x: box.x, y: box.y, width: box.width, height: box.height });

                    drawOverlay(ctx, canvas.width, canvas.height, box, recognizedName, 'scanning');

                    // Only send to backend if not already processing and not in cooldown
                    if (!isProcessingRef.current && !cooldownRef.current) {
                        isProcessingRef.current = true;
                        setStatus('recognizing');

                        try {
                            const descriptor = Array.from(detection.descriptor);
                            const { data } = await axios.post(`${API}/recognize-face`, { faceDescriptor: descriptor });

                            if (data.recognized) {
                                setRecognizedName(data.name);
                                setConfidence(data.confidence);

                                drawOverlay(ctx, canvas.width, canvas.height, box, data.name, 'recognized');

                                if (data.alreadyMarked) {
                                    setAttendanceTime(data.existingTime);
                                    setMessage(`Welcome back, ${data.name}! Already marked.`);
                                    setStatus('already');
                                    cooldownRef.current = true;
                                    setTimeout(() => {
                                        cooldownRef.current = false;
                                        if (onClose) onClose(); // Auto-close after 5s if already marked
                                    }, 5000);
                                } else {
                                    // Auto-mark attendance
                                    const { data: markData } = await axios.post(`${API}/auto-mark`, { userId: data.userId });

                                    setAttendanceTime(markData.time);
                                    setAttendanceStatus(markData.status);
                                    setMessage(`Attendance marked for ${markData.user}`);
                                    setStatus('success');

                                    cooldownRef.current = true;
                                    setTimeout(() => {
                                        cooldownRef.current = false;
                                        if (onClose) onClose(); // Auto-close after 3s on success
                                    }, 3000);
                                }
                            } else {
                                setRecognizedName('');
                                drawOverlay(ctx, canvas.width, canvas.height, box, '', 'scanning');
                                setStatus('scanning');
                            }
                        } catch (err) {
                            console.error('Recognition error:', err);
                            setStatus('scanning');
                        }
                        isProcessingRef.current = false;
                    } else {
                        // Still draw overlay while processing
                        drawOverlay(ctx, canvas.width, canvas.height, box, recognizedName, recognizedName ? 'recognized' : 'scanning');
                    }
                } else {
                    setRecognizedBox(null);
                    setRecognizedName('');
                    drawOverlay(ctx, canvas.width, canvas.height, null, '', 'scanning');
                    if (status === 'recognizing') setStatus('scanning');
                }
            } catch (err) {
                // Silent fail — keep scanning
            }

            if (running) {
                // Throttle to ~600ms between detections for performance
                setTimeout(() => {
                    if (running) animFrameRef.current = requestAnimationFrame(detectAndRecognize);
                }, 600);
            }
        };

        const timeout = setTimeout(detectAndRecognize, 500);
        return () => {
            running = false;
            clearTimeout(timeout);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [modelsReady, status, drawOverlay, recognizedName]);

    const statusText = {
        loading: 'LOADING AI MODELS...',
        scanning: 'SCANNING FOR FACES...',
        recognizing: 'IDENTIFYING...',
        success: 'ATTENDANCE MARKED ✓',
        already: 'ALREADY MARKED TODAY',
        error: 'ERROR — RETRY'
    };

    const statusColor = {
        loading: 'text-yellow-400',
        scanning: 'text-blue-400',
        recognizing: 'text-cyan-400',
        success: 'text-green-400',
        already: 'text-blue-400',
        error: 'text-red-400'
    };

    const dotColor = {
        loading: 'bg-yellow-400',
        scanning: 'bg-blue-400',
        recognizing: 'bg-cyan-400',
        success: 'bg-green-400',
        already: 'bg-blue-400',
        error: 'bg-red-400'
    };

    return (
        <div className="relative w-full h-full">
            {/* Webcam */}
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover rounded-2xl"
                mirrored={false}
            />

            {/* Canvas overlay */}
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 rounded-2xl" />

            {/* Status bar top-left */}
            <div className="absolute top-4 left-4 z-20">
                <div className="flex items-center gap-2.5 bg-black/70 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${dotColor[status]} animate-pulse shadow-lg`}></div>
                    <span className={`text-[10px] font-mono tracking-[0.2em] uppercase ${statusColor[status]}`}>
                        {statusText[status]}
                    </span>
                </div>
            </div>

            {/* Confidence display */}
            {confidence && recognizedName && (status === 'success' || status === 'already' || status === 'recognizing') && (
                <div className="absolute top-4 right-4 z-20">
                    <div className="bg-black/70 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10">
                        <span className="text-[9px] font-mono tracking-widest text-white/50 uppercase">MATCH </span>
                        <span className="text-[11px] font-mono text-green-400 font-bold">{confidence}%</span>
                    </div>
                </div>
            )}

            {/* Success overlay */}
            <AnimatePresence>
                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-0 left-0 right-0 z-30"
                    >
                        <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pt-12 rounded-b-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
                                    <Check size={22} className="text-white" strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg font-orbitron">{recognizedName}</h3>
                                    <p className="text-green-400 text-xs font-mono tracking-widest">ATTENDANCE RECORDED</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-white/50" />
                                    <span className="text-white/70 text-sm font-mono">{attendanceTime}</span>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${attendanceStatus === 'ON_TIME' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                    {attendanceStatus === 'ON_TIME' ? '✓ ON TIME' : '⏰ LATE'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {status === 'already' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-0 left-0 right-0 z-30"
                    >
                        <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pt-12 rounded-b-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40">
                                    <AlertCircle size={22} className="text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg font-orbitron">{recognizedName}</h3>
                                    <p className="text-blue-400 text-xs font-mono tracking-widest">ALREADY MARKED AT {attendanceTime}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-40 w-10 h-10 bg-black/60 hover:bg-red-500/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10 group shadow-xl"
                title="Close Scanner"
            >
                <X size={20} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            </button>
        </div>
    );
};

export default FaceCapture;
