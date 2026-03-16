const express = require('express');
const router = express.Router();

const User = require('../models/user');

const rateLimiter = require('../middleware/rateLimiter');

router.post('/reset-hwid', rateLimiter, async (req, res) => {
    const { hwid } = req.body;

    try {
        const user = await User.findOne({ hwid });
        if (!user) {
            return res.status(404).json({ message: 'HWID não encontrado' });
        }

        user.hwid = null;
        await user.save();

        res.json({ message: 'HWID resetado com sucesso' });
    } catch (error) {
        console.error('Erro ao resetar HWID:', error);
        res.status(500).json({ message: 'Erro ao resetar HWID' });
    }
});

module.exports = router;