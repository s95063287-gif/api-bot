const express = require('express');
const router = express.Router();

const User = require('../models/user');

const rateLimiter = require('../middleware/rateLimiter');

router.delete('/remove-login', rateLimiter, async (req, res) => {
    const { id } = req.body;

    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ error: 'Login não encontrado' });
        }

        res.json({ message: 'Login removido com sucesso', username: user.username });
    } catch (error) {
        console.error('Erro ao remover login:', error);
        res.status(500).json({ error: 'Erro ao remover login' });
    }
});

module.exports = router;