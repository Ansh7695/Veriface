import * as faceapi from 'face-api.js';

// Load models from a CDN to ensure they are available without manual download
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export const loadModels = async () => {
    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        console.log("FaceAPI Models Loaded");
        return true;
    } catch (error) {
        console.error("Failed to load FaceAPI models:", error);
        return false;
    }
};

export const getFaceDescriptor = async (imageElement) => {
    try {
        const detection = await faceapi.detectSingleFace(imageElement)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            throw new Error("No face detected");
        }

        return Array.from(detection.descriptor); // Convert Float32Array to normal Array
    } catch (error) {
        console.error("Face detection error:", error);
        throw error;
    }
};
