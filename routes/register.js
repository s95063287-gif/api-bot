const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Key = require('../models/key');
const rateLimiter = require('../middleware/rateLimiter');
const connectToDatabase = require('../Database');

router.post('/', rateLimiter, async (req, res) => {
    await connectToDatabase();
    const { hwid, username, key, password, discordId } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken.' });
        }

        let validKey = await Key.findOne({ key, used: false, expirationDate: { $gte: new Date() } });
        if (!validKey) {
            return res.status(403).json({ error: 'Invalid or expired key.' });
        }

        validKey.used = true;
        await validKey.save();

        let expirationDate = new Date(validKey.expirationDate);
        const user = new User({ hwid, username, expirationDate, password, discordId });
        await user.save();

        res.json({ message: 'Registration successful!', expirationDate });
    } catch (error) {
        console.error('Error registering:', error);
        res.status(500).json({ error: 'Error registering.' });
    }
});

module.exports = router;