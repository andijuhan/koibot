/* eslint-disable no-undef */
const { Client, LocalAuth } = require('whatsapp-web.js');
require('dotenv').config();

const client = new Client({
   puppeteer: {
      headless: true,
      args: process.env.NODE_ENV === 'production' && [
         '--no-sandbox',
         '--disable-setuid-sandbox',
      ],
      executablePath:
         process.env.NODE_ENV === 'development'
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : '/snap/bin/chromium',
   },
   authStrategy: new LocalAuth(),
});

module.exports = client;
