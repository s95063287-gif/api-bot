const express = require('express');
const router = express.Router();

const User = require('../models/user');
const Key = require('../models/key')

const rateLimiter = require('../middleware/rateLimiter');
router.post('/register', rateLimiter, async (req, res) => {
    console.log('Requisição recebida em /register:', req.body);
    const { hwid, username, key, password } = req.body;

    // Verificar a validade da chave
    let validKey = await Key.findOne({ key, used: false, expirationDate: { $gte: new Date() } });
    if (!validKey) {
        return res.status(403).json({ error: 'Chave inválida ou expirada.' });
    }

    // Marcar a chave como usada
    validKey.used = true;
    await validKey.save();

    let expirationDate = new Date(validKey.expirationDate);

    const user = new User({ hwid, username, expirationDate, password });
    console.log('Criando novo User:', user);

    await user.save();
    console.log('User salvo no banco de dados:', user);

    res.json({ message: 'Login criado com sucesso', expirationDate });
});

module.exports = router;