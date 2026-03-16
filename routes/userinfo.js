const express = require('express');
const router = express.Router();
const User = require('../models/user');
const connectToDatabase = require('../Database');
const rateLimiter = require('../middleware/rateLimiter');

router.post('/', rateLimiter, async (req, res) => {
    await connectToDatabase();
    const { username } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        res.json({
            username: user.username,
            hwid: user.hwid || 'Not set',
            expirationDate: user.expirationDate,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user.' });
    }
});

module.exports = router;