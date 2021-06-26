'use strict';

const { MessageEmbed } = require('discord.js');

const getPaymentSources = require('../helpers/getPaymentSources');
const getUserData = require('../helpers/getUserData');

const NITRO_TYPES = {
  0: 'Отсутствует',
  1: 'Nitro Classic ($5)',
  2: 'Nitro ($10)',
};

const CARD_NAMES = {
  2: '<:b5f7a9a2a7229d09a35be506bac28cfc:858105250556805160> **PayPal',
  MasterCard: '<:9a3ebeaac711b37a91b7de9b3ae55b21:858105250656026634> **MasterCard',
  mastercard: '<:9a3ebeaac711b37a91b7de9b3ae55b21:858105250656026634> **MasterCard',
  visa: '<:b614d13eb16fbcdbeacd6bad8b63460f:858105250560999454> **Visa',
};

module.exports = async message => {
  try {
    const userData = await getUserData(message.content);

    const embed = new MessageEmbed()
      .setColor('BLUE')
      .addField(
        `${userData.username}#${userData.discriminator}`,
        [
          `ID: **${userData.id}**`,
          `Подписка Nitro: **${userData.premium_type ? NITRO_TYPES[userData.premium_type] : NITRO_TYPES[0]}**`,
        ].join('\n'),
      )
      .addField(
        'Данные учётной записи',
        [
          `Двухфакторная аутентификация: **${userData.mfa_enabled ? 'Включено' : 'Выключено'}**`,
          `Электронная почта: **${userData.email ?? 'Отсутствует'}**`,
          `Номер телефона: **${userData.phone ?? 'Отсутствует'}**`,
        ].join('\n'),
      )
      .setThumbnail(`https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.webp?size=128`);

    const paymentSources = await getPaymentSources(message.content);
    embed.addField(
      'Привязанные карты',
      paymentSources.length === 0
        ? '**Отсутствуют**'
        : paymentSources
            .map(i => {
              const type = i.type === 1 ? i.brand : i.type;
              return [
                `${CARD_NAMES[type]} - ${type === 2 ? i.email : i.last_4}**${i.default ? ' **- По умолчанию**' : ''}${
                  i.invalid ? ' **- Невалидна**' : ''
                }${i.type === 1 ? `\nДействительна до **${i.expires_month}/${i.expires_year}**` : ''}`,
                `Город: **${i.billing_address.city}, ${i.billing_address.state}, ${i.billing_address.country}**`,
                `Адрес: **${i.billing_address.line_1}${
                  i.billing_address.line_2 ? ` ${i.billing_address.line_2}, ` : ''
                }${i.billing_address.postal_code ? `, ${i.billing_address.postal_code}` : ''}**`,
                `Имя: **${i.billing_address.name}**`,
              ].join('\n');
            })
            .join('\n\n'),
    );

    message.reply(embed);
  } catch (err) {
    console.error(err);
    message.reply(`Произошла ошибка при поиске информации: ${err?.response?.data?.message ?? err.message}`);
  }
};
