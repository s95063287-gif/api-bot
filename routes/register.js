const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Key = require('../models/key');
const rateLimiter = require('../middleware/rateLimiter');
const connectToDatabase = require('../Database');

router.post('/', rateLimiter, async (req, res) => {
    await connectToDatabase();
    const { hwid, username, key, password } = req.body;

    try {
        let validKey = await Key.findOne({ key, used: false, expirationDate: { $gte: new Date() } });
        if (!validKey) {
            return res.status(403).json({ error: 'Chave inválida ou expirada.' });
        }

        validKey.used = true;
        await validKey.save();

        let expirationDate = new Date(validKey.expirationDate);
        const user = new User({ hwid, username, expirationDate, password });
        await user.save();

        res.json({ message: 'Login criado com sucesso', expirationDate });
    } catch (error) {
        console.error('Erro ao registrar:', error);
        res.status(500).json({ error: 'Erro ao registrar.' });
    }
});

module.exports = router;