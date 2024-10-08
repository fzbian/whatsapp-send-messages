const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { unlinkSync } = require('fs');
const qrcode = require('qrcode-terminal'); 

const app = express();
const PORT = 3000;

app.use(express.json());

const client = new Client({
  puppeteer: {
    headless: true, // Ejecutar en modo headless
    executablePath: '/usr/bin/chromium-browser', // Ruta de Chromium en Ubuntu
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // Esto evitará que se creen múltiples procesos
      '--disable-gpu',
    ],
  },
  authStrategy: new LocalAuth({
    dataPath: './auth_info',
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
