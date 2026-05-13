const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');

// Helper to check if requester is admin or owner
const isOwnerOrAdmin = (req) => {
    try {
        return req.user && (req.user.role === 'admin' || req.user._id.toString() === req.params.id);
    } catch (e) {
        return false;
    }
}

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            // Password update logic if needed

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get user by id
// @route   GET /api/users/:id
// @access  Private (owner or admin)
router.get('/:id', protect, async (req, res) => {
    if (!isOwnerOrAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Add a device (MAC) to user
// @route   POST /api/users/:id/devices
// @access  Private (owner or admin)
router.post('/:id/devices', protect, async (req, res) => {
    if (!isOwnerOrAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
    const { mac, name } = req.body;
    if (!mac) return res.status(400).json({ message: 'MAC address required' });
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        // avoid duplicates
        const normalized = mac.toLowerCase();
        if (!user.devices) user.devices = [];
        if (user.devices.find(d => d.mac && d.mac.toLowerCase() === normalized)) {
            return res.status(200).json({ message: 'Device already registered' });
        }
        user.devices.push({ mac: normalized, name: name || '' });
        await user.save();
        res.json({ message: 'Device added', devices: user.devices });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Remove a device by MAC
// @route   DELETE /api/users/:id/devices/:mac
// @access  Private (owner or admin)
router.delete('/:id/devices/:mac', protect, async (req, res) => {
    if (!isOwnerOrAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const macParam = req.params.mac.toLowerCase();
        user.devices = (user.devices || []).filter(d => (d.mac || '').toLowerCase() !== macParam);
        await user.save();
        res.json({ message: 'Device removed', devices: user.devices });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
