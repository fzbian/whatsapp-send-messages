const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { unlinkSync } = require('fs'); // Importar readFileSync
const qrcode = require('qrcode-terminal'); 
const { MessageMedia } = require('whatsapp-web.js');
const path = require('path'); // Importar path para manejar rutas de archivos

const app = express();
const PORT = 3000;

app.use(express.json());

const client = new Client({
  puppeteer: {
    headless: true, 
    executablePath: '/usr/bin/chromium-browser', 
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', 
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

app.post('/send-image-message', async (req, res) => {
  const { number, message, imageName } = req.body; // Recibe el nombre de la imagen

  if (!number || !message || !imageName) {
    return res.status(400).json({ error: 'Faltan parámetros. Se requiere número, mensaje y nombre de imagen.' });
  }

  try {
    const jid = `${number}@c.us`;
    console.log("JID:", jid);

    // Crea la instancia de MessageMedia desde el archivo
    const imagePath = path.join(__dirname, 'images', imageName); 
    const media = MessageMedia.fromFilePath(imagePath);

    await client.sendMessage(jid, message, { media });
    res.status(200).json({ status: 'Mensaje con imagen enviado correctamente' });
  } catch (error) {
    console.error('Error enviando el mensaje con imagen:', error);
    res.status(500).json({ error: 'Error enviando el mensaje con imagen' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});