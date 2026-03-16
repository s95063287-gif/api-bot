require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const colors = require('colors');

const app = express();
const router = express.Router();
app.use(bodyParser.json());

app.use((req, res, next) => {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`IP do cliente: ${clientIp}`);
    next();
});

const connectToDatabase = require('./Database');

const AddLogin = require('./routes/add-login'); 
const authRoute = require('./routes/auth');
const GenerateKey = require('./routes/generate-key');
const Register = require('./routes/register');
const RemoveLogin = require('./routes/remove-login');
const resethwidRoute = require('./routes/resethwid');

const PORT = process.env.PORT || 3000;

app.use('/api', AddLogin);
app.use('/api', authRoute);
app.use('/api', GenerateKey);
app.use('/api', Register);
app.use('/api', RemoveLogin);
app.use('/api', resethwidRoute);

connectToDatabase().then(() => {
    app.listen(PORT, () => console.log('Sucesso '.green + `Servidor rodando na porta`, `${PORT}` .cyan));
});
