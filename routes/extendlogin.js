const express = require('express');
const router = express.Router();
const User = require('../models/user');
const connectToDatabase = require('../Database');
const rateLimiter = require('../middleware/rateLimiter');

router.post('/', rateLimiter, async (req, res) => {
    await connectToDatabase();
    const { username, duration } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const now = new Date();
        const base = user.expirationDate > now ? user.expirationDate : now;
        const newDate = new Date(base);

        switch (duration) {
            case '1day': newDate.setDate(newDate.getDate() + 1); break;
            case '1week': newDate.setDate(newDate.getDate() + 7); break;
            case '1month': newDate.setMonth(newDate.getMonth() + 1); break;
            case '3month': newDate.setMonth(newDate.getMonth() + 3); break;
            case 'permanent': newDate.setFullYear(newDate.getFullYear() + 100); break;
            default: return res.status(400).json({ error: 'Invalid duration.' });
        }

        user.expirationDate = newDate;
        await user.save();

        res.json({ message: 'Login extended successfully.', expirationDate: newDate });
    } catch (error) {
        res.status(500).json({ error: 'Error extending login.' });
    }
});

module.exports = router;