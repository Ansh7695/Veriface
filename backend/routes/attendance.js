const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');
const { sendOTP } = require('../services/emailService');
const axios = require('axios');
const multer = require('multer');

// Configure Multer for memory storage (for image upload)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Temporary store for OTPs (In production use Redis or DB with expiry)
const otpStore = {};

// Helper to get current IST time parts
const getISTTime = () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + (istOffset + now.getTimezoneOffset() * 60 * 1000));
    return ist;
};

const getISTDateString = () => {
    const ist = getISTTime();
    return ist.toISOString().split('T')[0];
};

const getISTTimeString = () => {
    const ist = getISTTime();
    return ist.toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Helper to check if late (after 10:00 AM IST)
const isLate = () => {
    const ist = getISTTime();
    const hours = ist.getHours();
    const minutes = ist.getMinutes();
    // At or before 10:00 AM = ON_TIME, after 10:00 AM = LATE
    if (hours > 10 || (hours === 10 && minutes > 0)) {
        return 'LATE';
    }
    return 'ON_TIME';
};

// @desc    Get today's attendance (Public/Protected)
// @route   GET /api/attendance/today
router.get('/today', async (req, res) => {
    try {
        const today = getISTDateString();
        // Fetch attendance for today, populate user name
        const attendance = await Attendance.find({ date: today })
            .populate('userId', 'name')
            .sort({ createdAt: -1 }); // Latest first

        res.json(attendance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all attendance records (Admin)
// @route   GET /api/attendance/all
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
    try {
        const attendance = await Attendance.find({})
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
        res.json(attendance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Helper to get encoding from AI Service
const getFaceEncodingFromAI = async (imageBuffer, filename = 'face.jpg') => {
    try {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', imageBuffer, { filename }); // AI service expects 'file'

        const response = await axios.post('http://localhost:8000/get-encoding', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        if (response.data && response.data.encoding) {
            return response.data.encoding;
        }
        return null;
    } catch (error) {
        console.error('AI Service Error:', error.message);
        return null;
    }
};

// Helper for Euclidean Distance
const euclideanDistance = (enc1, enc2) => {
    if (!enc1 || !enc2 || enc1.length !== enc2.length) return 1.0; // Max distance
    let sum = 0;
    for (let i = 0; i < enc1.length; i++) {
        sum += Math.pow(enc1[i] - enc2[i], 2);
    }
    return Math.sqrt(sum);
};

// @desc    Mark attendance via Face
// @route   POST /api/attendance/mark-face
// @access  Private
router.post('/mark-face', protect, upload.single('image'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.isFaceRegistered || !user.faceEncoding || user.faceEncoding.length === 0) {
            return res.status(400).json({ message: 'Face not registered' });
        }

        // Check if attendance already marked today
        const today = getISTDateString();
        const existing = await Attendance.findOne({ userId: req.user.id, date: today });
        if (existing) {
            return res.status(400).json({ message: 'Attendance already marked for today' });
        }

        if (!req.file && !req.body.faceDescriptor) {
            return res.status(400).json({ message: 'No image or face data uploaded' });
        }

        // Priority 1: Use client-sent face descriptor
        let liveEncoding = null;
        if (req.body.faceDescriptor) {
            try {
                liveEncoding = JSON.parse(req.body.faceDescriptor);
            } catch (e) {
                console.error("Error parsing provided descriptor", e);
            }
        }

        // Priority 2: Fall back to AI Service
        if ((!liveEncoding || liveEncoding.length === 0) && req.file) {
            liveEncoding = await getFaceEncodingFromAI(req.file.buffer, req.file.originalname);
        }

        if (!liveEncoding) {
            return res.status(400).json({ message: 'Face not detected in image. Please try again.' });
        }

        // Verify
        const distance = euclideanDistance(liveEncoding, user.faceEncoding);
        const THRESHOLD = 0.5; // Strict threshold

        if (distance > THRESHOLD) {
            return res.status(401).json({ message: 'Face verification failed. Not a match.' });
        }

        const status = isLate();
        const attendance = await Attendance.create({
            userId: req.user.id,
            date: today,
            time: getISTTimeString(),
            method: 'FACE',
            status: status,
            deviceInfo: req.headers['user-agent'],
            ipAddress: req.ip
        });

        res.status(201).json(attendance);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ... (OTP routes unchanged) ...

// @desc    Mark attendance via Face (Public)
// @route   POST /api/attendance/mark-face-public
// @access  Public
router.post('/mark-face-public', upload.single('image'), async (req, res) => {
    try {
        if (!req.file && !req.body.faceDescriptor) {
            return res.status(400).json({ message: 'No image or face data uploaded' });
        }

        // Priority 1: Use client-sent face descriptor (from face-api.js in browser)
        let liveEncoding = null;
        if (req.body.faceDescriptor) {
            try {
                liveEncoding = JSON.parse(req.body.faceDescriptor);
            } catch (e) {
                console.error("Error parsing provided descriptor", e);
            }
        }

        // Priority 2: Fall back to AI Service if no client descriptor
        if ((!liveEncoding || liveEncoding.length === 0) && req.file) {
            liveEncoding = await getFaceEncodingFromAI(req.file.buffer, req.file.originalname);
        }

        if (!liveEncoding) {
            return res.status(400).json({ message: 'No face detected in live image. Please try again.' });
        }

        // 2. Fetch all eligible employees
        // Optimization: In real app, maybe filter by some other means, but for < 1000 users this is fine.
        const employees = await User.find({ role: 'employee', isFaceRegistered: true });

        if (employees.length === 0) {
            return res.status(404).json({ message: 'No registered faces in database.' });
        }

        // 3. Find Best Match
        let bestMatch = null;
        let minDistance = 1.0;
        const THRESHOLD = 0.5;

        for (const emp of employees) {
            if (emp.faceEncoding && emp.faceEncoding.length > 0) {
                const dist = euclideanDistance(liveEncoding, emp.faceEncoding);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestMatch = emp;
                }
            }
        }

        if (minDistance > THRESHOLD || !bestMatch) {
            return res.status(401).json({ message: 'Face verification failed. User not recognized.' });
        }

        // 4. Found Match
        const user = bestMatch;

        // Check duplicate
        const today = getISTDateString();
        const existing = await Attendance.findOne({ userId: user._id, date: today });
        if (existing) {
            return res.status(200).json({
                message: 'Welcome back! Attendance already marked.',
                user: user.name,
                time: existing.time
            });
        }

        const status = isLate();
        const attendance = await Attendance.create({
            userId: user._id,
            date: today,
            time: getISTTimeString(),
            method: 'FACE',
            status: status,
            deviceInfo: req.headers['user-agent'],
            ipAddress: req.ip
        });

        res.status(201).json({
            message: 'Attendance Marked Successfully',
            user: user.name,
            time: attendance.time,
            status: attendance.status
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Verification Error: ' + error.message });
    }
});

// @desc    Recognize face from descriptor (returns match, does NOT mark attendance)
// @route   POST /api/attendance/recognize-face
// @access  Public
router.post('/recognize-face', async (req, res) => {
    try {
        const { faceDescriptor } = req.body;
        if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length === 0) {
            return res.status(400).json({ recognized: false, message: 'No face descriptor provided' });
        }

        const employees = await User.find({ isFaceRegistered: true, faceEncoding: { $exists: true, $ne: [] } });
        if (employees.length === 0) {
            return res.status(200).json({ recognized: false, message: 'No registered faces in database' });
        }

        let bestMatch = null;
        let minDistance = 1.0;
        const THRESHOLD = 0.5;

        for (const emp of employees) {
            if (emp.faceEncoding && emp.faceEncoding.length > 0) {
                const dist = euclideanDistance(faceDescriptor, emp.faceEncoding);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestMatch = emp;
                }
            }
        }

        if (minDistance > THRESHOLD || !bestMatch) {
            return res.status(200).json({ recognized: false, message: 'Face not recognized' });
        }

        // Check if already marked today
        const today = getISTDateString();
        const existing = await Attendance.findOne({ userId: bestMatch._id, date: today });

        return res.status(200).json({
            recognized: true,
            userId: bestMatch._id,
            name: bestMatch.name,
            alreadyMarked: !!existing,
            existingTime: existing ? existing.time : null,
            confidence: ((1 - minDistance) * 100).toFixed(1)
        });
    } catch (error) {
        console.error('Recognize face error:', error);
        res.status(500).json({ recognized: false, message: 'Server error' });
    }
});

// @desc    Auto-mark attendance for a recognized user
// @route   POST /api/attendance/auto-mark
// @access  Public
router.post('/auto-mark', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'No userId provided' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const today = getISTDateString();
        const existing = await Attendance.findOne({ userId: user._id, date: today });
        if (existing) {
            return res.status(200).json({
                success: true,
                alreadyMarked: true,
                message: 'Attendance already marked today',
                user: user.name,
                time: existing.time,
                status: existing.status
            });
        }

        const status = isLate();
        const time = getISTTimeString();
        const attendance = await Attendance.create({
            userId: user._id,
            date: today,
            time: time,
            method: 'FACE',
            status: status,
            deviceInfo: req.headers['user-agent'],
            ipAddress: req.ip
        });

        return res.status(201).json({
            success: true,
            alreadyMarked: false,
            message: 'Attendance Marked Successfully',
            user: user.name,
            time: attendance.time,
            status: status
        });
    } catch (error) {
        console.error('Auto-mark error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Send OTP (Public)
// @route   POST /api/attendance/send-otp-public
// @access  Public
router.post('/send-otp-public', async (req, res) => {
    try {
        const { name } = req.body;
        // Case-insensitive search
        const user = await User.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

        if (!user) {
            return res.status(404).json({ message: 'Employee name not found.' });
        }

        if (!user.email) {
            return res.status(400).json({ message: 'No email linked to this user.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Store with email as key (since we verify by email later)
        otpStore[user.email] = { otp, expires: Date.now() + 60000, userId: user._id };

        // Send email
        await sendOTP(user.email, otp);

        res.json({ message: 'OTP sent to email', email: user.email });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Verify OTP and Mark Attendance (Public)
// @route   POST /api/attendance/verify-otp-public
// @access  Public
router.post('/verify-otp-public', async (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore[email];

    if (!record || record.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (Date.now() > record.expires) {
        return res.status(400).json({ message: 'OTP Expired' });
    }

    delete otpStore[email];

    try {
        const user = await User.findById(record.userId);
        const today = getISTDateString();
        const existing = await Attendance.findOne({ userId: user._id, date: today });

        if (existing) {
            return res.status(200).json({
                message: 'Attendance already marked',
                user: user.name,
                time: existing.time
            });
        }

        const status = isLate();
        const attendance = await Attendance.create({
            userId: user._id,
            date: today,
            time: getISTTimeString(),
            method: 'OTP',
            status: status,
            deviceInfo: req.headers['user-agent'],
            ipAddress: req.ip
        });

        res.status(201).json({
            message: 'Attendance Marked',
            user: user.name,
            time: attendance.time,
            status: attendance.status
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
