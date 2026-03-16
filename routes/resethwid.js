const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Key = require('../models/key');
const rateLimiter = require('../middleware/rateLimiter');
const connectToDatabase = require('../Database');

router.post('/', rateLimiter, async (req, res) => {
    await connectToDatabase();
    const { hwid, licenseKey } = req.body;

    try {
        // Mit License Key resetten
        if (licenseKey) {
            const key = await Key.findOne({ key: licenseKey });
            if (!key) {
                return res.status(403).json({ error: 'Invalid license key.' });
            }

            // User anhand des License Keys finden
            const user = await User.findOne({ hwid });
            if (!user) {
                return res.status(404).json({ error: 'HWID not found.' });
            }

            user.hwid = null;
            await user.save();

            return res.json({ message: 'HWID reset successfully with license key.' });
        }

        // Ohne License Key (Admin only - über Discord Bot)
        const user = await User.findOne({ hwid });
        if (!user) {
            return res.status(404).json({ error: 'HWID not found.' });
        }

        user.hwid = null;
        await user.save();

        res.json({ message: 'HWID reset successfully.' });
    } catch (error) {
        console.error('Error resetting HWID:', error);
        res.status(500).json({ error: 'Error resetting HWID.' });
    }
});

// Reset mit Username + License Key (für C++ Client)
router.post('/with-key', rateLimiter, async (req, res) => {
    await connectToDatabase();
    const { username, licenseKey } = req.body;

    try {
        if (!username || !licenseKey) {
            return res.status(400).json({ error: 'Username and license key required.' });
        }

        // License Key prüfen
        const key = await Key.findOne({ key: licenseKey, used: true });
        if (!key) {
            return res.status(403).json({ error: 'Invalid license key.' });
        }

        // User finden
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        user.hwid = null;
        await user.save();

        res.json({ message: 'HWID reset successfully! You can now login on a new device.' });
    } catch (error) {
        console.error('Error resetting HWID:', error);
        res.status(500).json({ error: 'Error resetting HWID.' });
    }
});

module.exports = router;