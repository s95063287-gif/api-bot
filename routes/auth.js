const express = require('express');
const router = express.Router();
const Key = require('../models/key');
const rateLimiter = require('../middleware/rateLimiter');
const connectToDatabase = require('../Database'); // ← NEU

router.post('/generate-key', rateLimiter, async (req, res) => {
    await connectToDatabase(); // ← NEU
    const { key, duration } = req.body;

    try {
        let expirationDate;

        switch (duration) {
            case '1day':
                expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 1);
                break;
            case '1week':
                expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 7);
                break;
            case '1month':
                expirationDate = new Date();
                expirationDate.setMonth(expirationDate.getMonth() + 1);
                break;
            case '3month':
                expirationDate = new Date();
                expirationDate.setMonth(expirationDate.getMonth() + 3);
                break;
            case 'permanent':
                expirationDate = new Date();
                expirationDate.setFullYear(expirationDate.getFullYear() + 100);
                break;
            case '10year':
                expirationDate = new Date();
                expirationDate.setFullYear(expirationDate.getFullYear() + 10);
                break;
            case '2min':
                expirationDate = new Date();
                expirationDate.setMinutes(expirationDate.getMinutes() + 2);
                break;
            default:
                return res.status(400).json({ error: 'Invalid duration' });
        }

        const newKey = new Key({ key, expirationDate });
        await newKey.save();

        res.json({ key: newKey.key });
    } catch (error) {
        console.error('Erro ao salvar key:', error);
        res.status(500).json({ error: 'Erro ao salvar key' });
    }
});

module.exports = router;