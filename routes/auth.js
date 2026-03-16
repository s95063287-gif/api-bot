const express = require('express');
const router = express.Router();

const User = require('../models/user');

const rateLimiter = require('../middleware/rateLimiter');

const checkAndDeleteExpired = require('../middleware/checkAndDeleteExpired');

router.post('/auth', rateLimiter, checkAndDeleteExpired, async (req, res) => {
    console.log('Requisição recebida em /auth:', req.body);
    const { hwid, username, password } = req.body;

    try {
        let user = await User.findOne({ hwid });

            if (!user && username ) {
                user = await User.findOne({ username });
            if (user) {
                if (!user.hwid) {
                    user.hwid = hwid;
                    await user.save();
                }
            }
        }

        console.log('Usuário encontrado:', user);

        if (!user) {
            return res.status(404).json({ error: 'Discord ID não encontrado.' });
        }

        if (user.expirationDate < new Date()) {
            await User.deleteOne({ hwid });
            return res.status(403).json({ error: 'Login expirado. Por favor, renove seu login.' });
        }

        if (user.username === username) {
            if (user.password) {
                if (user.password === password) {
                    return res.json({ message: 'Login bem-sucedido!' });
                } else {
                    return res.status(403).json({ error: 'Senha incorreta.' });
                }
            } else {
                return res.json({ message: 'Login bem-sucedido!' });
            }
        } else {
            return res.status(403).json({ error: 'Usuário Inválido.' });
        }
    } catch (error) {
        console.error('Erro ao autenticar:', error);
        res.status(500).json({ error: 'Erro ao autenticar.' });
    }
});

module.exports = router;