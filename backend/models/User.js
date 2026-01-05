const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['admin', 'employee', 'intern'],
        default: 'employee',
    },
    password: {
        type: String, // For admin or if employees need login
    },
    faceEncoding: {
        type: [Number], // Store 128-d vector
        default: [],
    },
    isFaceRegistered: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('User', userSchema);
