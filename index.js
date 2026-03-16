require('dotenv').config(); // Carrega as variáveis de ambiente do .env
const express = require('express');
const bodyParser = require('body-parser'); // Ainda funcional, mas express.json() é o padrão moderno
const colors = require('colors'); // Para estilizar o console.log

const app = express(); // Inicializa o aplicativo Express

// Middleware para parsing de JSON
// app.use(express.json()); // Esta é a forma moderna, substitui bodyParser.json()
app.use(bodyParser.json()); // Mantido para compatibilidade com seu código original

// Middleware para log de IP do cliente
app.use((req, res, next) => {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`IP do cliente: ${clientIp}`);
    next(); // Continua para a próxima middleware/rota
});

// Importa a função de conexão com o banco de dados
const connectToDatabase = require('./Database');

// Importa suas rotas
const AddLogin = require('./routes/add-login');
const authRoute = require('./routes/auth');
const GenerateKey = require('./routes/generate-key');
const Register = require('./routes/register');
const RemoveLogin = require('./routes/remove-login');
const resethwidRoute = require('./routes/resethwid');

const PORT = process.env.PORT || 10000; // Define a porta, usando a variável de ambiente ou 10000

// =================================================================
// FIX: Adicionando uma rota GET para a raiz (/)
// Isso resolverá o erro "Cannot GET /" quando a URL base é acessada.
// =================================================================
app.get('/', (req, res) => {
    res.status(200).send('Bem-vindo à sua API! Verifique a documentação para as rotas disponíveis (ex: /api/auth).');
});

// =================================================================
// FIX: Removendo a declaração de 'router' não utilizada
// Você estava definindo 'router' mas não o usava. Suas rotas já estão sendo montadas diretamente no 'app'.
// =================================================================
// const router = express.Router(); // Esta linha foi removida, pois 'router' não estava sendo utilizado.

// Monta todas as suas rotas sob o prefixo '/api'
app.use('/api', AddLogin);
app.use('/api', authRoute);
app.use('/api', GenerateKey);
app.use('/api', Register);
app.use('/api', RemoveLogin);
app.use('/api', resethwidRoute);

// Conecta ao banco de dados e, em seguida, inicia o servidor
connectToDatabase().then(() => {
    // A Vercel gerencia a escuta da porta automaticamente para funções serverless.
    // Esta parte do código (app.listen) é mais relevante para execução local.
    // Em produção na Vercel, o 'module.exports = app;' é o que importa.
    app.listen(PORT, () => console.log('Sucesso '.green + `Servidor rodando na porta`, `${PORT}` .cyan));
}).catch(err => {
    console.error('Falha ao conectar ao banco de dados e iniciar o servidor:', err);
    process.exit(1); // Encerra o processo se a conexão com o BD falhar
});

// =================================================================
// ESSENCIAL PARA A VERCEL: Exporta o aplicativo Express
// A Vercel espera que o arquivo principal exporte o aplicativo para ser executado como uma função serverless.
// =================================================================
module.exports = app;