const express = require('express');
const router = express.Router();
const User = require('../models/user');
const connectToDatabase = require('../Database');
const rateLimiter = require('../middleware/rateLimiter');

// POST - für Discord Bot
router.post('/', rateLimiter, async (req, res) => {
    await connectToDatabase();
    const { username } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const now = new Date();
        const expDate = new Date(user.expirationDate);
        const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

        res.json({
            username: user.username,
            hwid: user.hwid || 'Not set',
            discordId: user.discordId || 'Not set',
            hasPassword: !!user.password,
            expirationDate: user.expirationDate,
            createdAt: user.createdAt || user._id.getTimestamp(),
            isExpired: expDate < now,
            daysLeft: daysLeft < 0 ? 0 : daysLeft
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user.' });
    }
});

// GET - für C++ Client
router.get('/me', rateLimiter, async (req, res) => {
    await connectToDatabase();
    const { username } = req.query;

    if (!username) return res.status(400).json({ error: 'Username required.' });

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const now = new Date();
        const expDate = new Date(user.expirationDate);
        const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

        res.json({
            username: user.username,
            hwid: user.hwid || 'Not set',
            discordId: user.discordId || 'Not set',
            hasPassword: !!user.password,
            expirationDate: user.expirationDate,
            createdAt: user.createdAt || user._id.getTimestamp(),
            isExpired: expDate < now,
            daysLeft: daysLeft < 0 ? 0 : daysLeft
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user.' });
    }
});

module.exports = router;