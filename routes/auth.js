const express = require('express');
const router = express.Router();
const User = require('../models/user');
const rateLimiter = require('../middleware/rateLimiter');
const checkAndDeleteExpired = require('../middleware/checkAndDeleteExpired');
const connectToDatabase = require('../Database');

router.post('/', rateLimiter, checkAndDeleteExpired, async (req, res) => {
    await connectToDatabase();
    const { hwid, username, password } = req.body;

    try {
        let user = await User.findOne({ hwid });

        if (!user && username) {
            user = await User.findOne({ username });
            if (user) {
                if (!user.hwid) {
                    user.hwid = hwid;
                    await user.save();
                }
            }
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (user.expirationDate < new Date()) {
            await User.deleteOne({ hwid });
            return res.status(403).json({ error: 'Login expired. Please renew your login.' });
        }

        if (user.username === username) {
            if (user.password) {
                if (user.password === password) {
                    return res.json({ message: 'Login successful!' });
                } else {
                    return res.status(403).json({ error: 'Incorrect password.' });
                }
            } else {
                return res.json({ message: 'Login successful!' });
            }
        } else {
            return res.status(403).json({ error: 'Invalid user.' });
        }
    } catch (error) {
        console.error('Error authenticating:', error);
        res.status(500).json({ error: 'Error authenticating.' });
    }
});

module.exports = router;