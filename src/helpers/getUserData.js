'use strict';

const axios = require('axios');

module.exports = async token => {
  const res = await axios.get('https://discord.com/api/v9/users/@me', {
    headers: { Authorization: token },
  });
  if (!res.data || !res.data.id) throw new Error('Не удалось получить информацию о пользователе');
  return res.data;
};
