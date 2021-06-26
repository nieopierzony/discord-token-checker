'use strict';

const axios = require('axios');

module.exports = async token => {
  const res = await axios.get('https://discord.com/api/v9/users/@me/billing/payment-sources', {
    headers: { Authorization: token },
  });
  if (!res.data) throw new Error('Не удалось получить информацию о привязанных картах');
  return res.data;
};
