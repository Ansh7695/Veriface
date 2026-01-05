const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, 'backend', 'models_weights');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
const files = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

const downloadFile = (file) => {
    const filePath = path.join(modelsDir, file);
    const fileUrl = baseUrl + file;
    const fileStream = fs.createWriteStream(filePath);

    https.get(fileUrl, (response) => {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`Downloaded: ${file}`);
        });
    }).on('error', (err) => {
        fs.unlink(filePath);
        console.error(`Error downloading ${file}: ${err.message}`);
    });
};

console.log('Starting model downloads...');
files.forEach(downloadFile);
