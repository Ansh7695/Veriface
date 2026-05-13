const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
    },
    time: {
        type: String, // HH:mm:ss
        required: true,
    },
    method: {
        type: String,
        enum: ['FACE', 'OTP', 'WIFI'],
        required: true,
    },
    status: {
        type: String,
        enum: ['ON_TIME', 'LATE'],
        required: true,
    },
    deviceInfo: {
        type: String,
    },
    ipAddress: {
        type: String,
    }
}, { timestamps: true });

// Prevent duplicate attendance for same user on same day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
