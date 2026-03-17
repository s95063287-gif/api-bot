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
        // Case-insensitive suche
        let user = await User.findOne({ hwid });

        if (!user && username) {
            user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
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

        // HWID Ban Check
        if (user.hwidBanned) {
            return res.status(403).json({ error: `You are banned.\nReason: ${user.banReason || 'No reason provided.'}` });
        }

        if (user.expirationDate < new Date()) {
            await User.deleteOne({ _id: user._id });
            return res.status(403).json({ error: 'Login expired. Please renew your login.' });
        }

        // Case-insensitive username check
        if (user.username.toLowerCase() === username.toLowerCase()) {
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