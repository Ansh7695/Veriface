import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import LaserScan from './LaserScan';

const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
};

const FaceCapture = ({ onCapture }) => {
    const webcamRef = useRef(null);
    const [image, setImage] = useState(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImage(imageSrc);
        onCapture(imageSrc);
    }, [webcamRef, onCapture]);

    const retake = () => {
        setImage(null);
        onCapture(null);
    };

    return (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-blue-500/30 shadow-lg">
            {!image && <LaserScan />}
            {image ? (
                <div className="relative">
                    <img src={image} alt="Captured" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay"></div>
                </div>
            ) : (
                <Webcam
                    audio={false}
                    height={720}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={1280}
                    videoConstraints={videoConstraints}
                    className="w-full h-full object-cover opacity-80"
                />
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                {image ? (
                    <button
                        onClick={retake}
                        className="px-6 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full font-mono text-xs uppercase tracking-widest backdrop-blur-md transition-colors shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    >
                        Retake Scan
                    </button>
                ) : (
                    <button
                        onClick={capture}
                        className="px-6 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-full font-mono text-xs uppercase tracking-widest backdrop-blur-md transition-colors shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-white/20"
                    >
                        Capture Face
                    </button>
                )}
            </div>
        </div>
    );
};

export default FaceCapture;
