
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

        // Convert base64 to blob/file if needed, or pass base64
        // Here passing base64 string
        onCapture(imageSrc);
    }, [webcamRef, onCapture]);

    const retake = () => {
        setImage(null);
        onCapture(null);
    };

    return (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
            <LaserScan />
            {image ? (
                <div className="mb-4">
                    <img src={image} alt="Captured" className="rounded-lg shadow-lg" />
                    <button
                        onClick={retake}
                        className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Retake
                    </button>
                </div>
            ) : (
                <div className="mb-4 relative">
                    <Webcam
                        audio={false}
                        height={720}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width={1280}
                        videoConstraints={videoConstraints}
                        className="rounded-lg shadow-lg"
                    />
                    <button
                        onClick={capture}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-xl"
                    >
                        Capture Face
                    </button>
                </div>
            )}
        </div>
    );
};

export default FaceCapture;
