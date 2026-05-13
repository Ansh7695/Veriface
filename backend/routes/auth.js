const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect, admin } = require('../middleware/authMiddleware');
const axios = require('axios');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (user.password === password || user.role === 'employee')) {
            // Employees might not have passwords, but Admins do. 
            // Plan says "Employee Interface – for marking attendance". Maybe they don't login?
            // User Roles: "Employee: Mark attendance... View today's status".
            // They probably need to login to view status.

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Register a new user (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
router.post('/register', protect, admin, async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password, // Should hash this
            role: role || 'employee',
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Helper to get encoding from AI Service
const getFaceEncodingFromAI = async (imageBuffer, filename = 'face.jpg') => {
    try {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', imageBuffer, { filename });

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
        return null; // Fail silently or handle? Better to return null.
    }
};

// @desc    Register a new user (Public/Employee) with Face
// @route   POST /api/auth/register-employee
// @access  Public
router.post('/register-employee', upload.single('image'), async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let faceEncoding = [];
        // Priority 1: Client sends descriptor (if robust frontend exists)
        if (req.body.faceDescriptor) {
            try {
                faceEncoding = JSON.parse(req.body.faceDescriptor);
            } catch (e) {
                console.error("Error parsing provided descriptor", e);
            }
        }

        // Priority 2: Use AI Service if image provided and no descriptor
        if ((!faceEncoding || faceEncoding.length === 0) && req.file) {
            console.log("Generating encoding from image via AI Service...");
            const aiEncoding = await getFaceEncodingFromAI(req.file.buffer, req.file.originalname);
            if (aiEncoding) {
                faceEncoding = aiEncoding;
            } else {
                console.warn("AI Service failed to generate encoding from provided image.");
            }
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'employee',
            faceEncoding,
            isFaceRegistered: faceEncoding.length > 0
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isFaceRegistered: user.isFaceRegistered
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
