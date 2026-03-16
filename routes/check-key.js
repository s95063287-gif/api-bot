const express = require('express');
const router = express.Router();
const Key = require('../models/key');
const connectToDatabase = require('../Database');
const rateLimiter = require('../middleware/rateLimiter');

router.post('/', rateLimiter, async (req, res) => {
    await connectToDatabase();
    const { key } = req.body;

    try {
        const validKey = await Key.findOne({ 
            key, 
            used: false, 
            expirationDate: { $gte: new Date() } 
        });

        if (!validKey) {
            return res.json({ valid: false, error: 'Invalid or expired key.' });
        }

        res.json({ 
            valid: true,
            expirationDate: validKey.expirationDate
        });
    } catch (error) {
        res.status(500).json({ valid: false, error: 'Error checking key.' });
    }
});

module.exports = router;