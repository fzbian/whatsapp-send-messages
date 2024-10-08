const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { unlinkSync } = require('fs');
const qrcode = require('qrcode-terminal'); 

const app = express();
const PORT = 3000;

app.use(express.json());

const client = new Client({
  authStrategy: new LocalAuth({
    session: session,
    dataPath: './auth_info',
    puppeteer: {headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']}
  }),
});

client.on('qr', (qr) => {
  console.log('Escanea el código QR:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Cliente de WhatsApp conectado!');
});

client.on('auth_failure', (msg) => {
  console.error('Error de autenticación:', msg);
  unlinkSync('./auth_info/auth_info.json');
});

client.initialize();

app.post('/send-message', async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: 'Faltan parámetros. Se requiere número y mensaje.' });
  }

  try {
    const jid = `${number}@c.us`;
    console.log("JID:", jid);

    await client.sendMessage(jid, message);
    res.status(200).json({ status: 'Mensaje enviado correctamente' });
  } catch (error) {
    console.error('Error enviando el mensaje:', error);
    res.status(500).json({ error: 'Error enviando el mensaje' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
