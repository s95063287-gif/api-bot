const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Muitas requisições vindas deste IP, tente novamente mais tarde."
});

module.exports = limiter;