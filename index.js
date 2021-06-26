'use strict';

require('dotenv').config();
const { Client } = require('discord.js');

const manyParse = require('./handlers/manyParse');
const singleParse = require('./handlers/singleParse');

const client = new Client();

client.once('ready', () => {
  console.log('Бот авторизован как %s [%s]', client.user.tag, client.user.id);
});

client.on('message', message => {
  if (message.author.id === client.user.id) return;

  const isInChannel = message.channel.id === '780103269404901387';
  if (
    (isInChannel && /[MNO][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/.test(message.content)) ||
    message.content.startsWith('mfa.')
  ) {
    singleParse(message);
    return;
  }

  if (isInChannel && message.attachments.size > 0 && message.attachments.first().name.includes('.txt')) {
    manyParse(message);
  }
});

client.login(process.env.DISCORD_TOKEN);
