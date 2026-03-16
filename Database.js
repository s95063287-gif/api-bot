require('colors')
const mongoose = require('mongoose')
require('dotenv').config({
    path: "./.env"
})

console.log('MongoDB URI:', process.env.MONGODB_URL);

mongoose.set('strictQuery', true);

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Sucesso ".green + 'Conectado ao MongoDB');
        } catch (err) {
        console.error("Falha ".red + 'Erro ao conectar ao MongoDB', err);
    }
}

module.exports = connectToDatabase;

mongoose.connection.on('connected', () => {
    console.log("Sucesso ".green + 'Mongoose conectado ao MongoDB');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error("Falha ".red + 'Erro de conexão do Mongoose: ', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log("Falha ".red + 'Mongoose desconectado do MongoDB');
  });
  
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log("Falha ".red + 'Mongoose desconectado devido ao encerramento do aplicativo');
    process.exit(0);
  });