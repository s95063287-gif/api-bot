const express = require('express');
const router = express.Router();

const User = require('../models/user');

const rateLimiter = require('../middleware/rateLimiter');

// Rota para desbanir
router.post('/unban', rateLimiter, async (req, res) => {
    const { identifier, type } = req.body;

    try {
        let user;
        if (type === 'hwid') {
            user = await User.findOne({ hwid: identifier });
        } else if (type === 'username') {
            user = await User.findOne({ username: identifier });
        }

        if (!user) {
            return res.status(404).json({ message: `**${type}** não encontrado` });
        }

        user.hwidBanned = false;
        await user.save();

        res.json({ message: `**${identifier}** desbanido com sucesso` });
    } catch (error) {
        console.error('Erro ao desbanir:', error);
        res.status(500).json({ message: 'Erro ao desbanir' });
    }
});

module.exports = router;