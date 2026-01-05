const faceapi = require('@vladmandic/face-api');
const { Canvas, Image, ImageData } = require('canvas');
const fs = require('fs');
const path = require('path');

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const modelsPath = path.join(__dirname, '../models_weights');

let modelsLoaded = false;

const loadModels = async () => {
    if (modelsLoaded) return;
    try {
        console.log('Loading Face API models from:', modelsPath);
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
        modelsLoaded = true;
        console.log('Face API Models Loaded Successfully');
    } catch (error) {
        console.error('Error loading Face API models:', error);
        throw error; // Fail hard to see trace
    }
};

const getFaceDescriptor = async (imageBuffer) => {
    if (!modelsLoaded) await loadModels();

    const img = await faceapi.bufferToImage(imageBuffer);
    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    if (!detection) {
        throw new Error('No face detected in image');
    }

    return detection.descriptor; // Returns Float32Array
};

const findBestMatch = async (descriptor, labeledDescriptors) => {
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
    const bestMatch = faceMatcher.findBestMatch(descriptor);
    return bestMatch;
};

module.exports = { loadModels, getFaceDescriptor, findBestMatch };
