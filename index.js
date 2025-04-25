const TelegramBot = require('node-telegram-bot-api');

// Replace with your Bot's token (which you got from @BotFather)
const token = '7638470656:AAFQbfWA3mo_4pvcMnWKwelbM-j3JDAP_Fg';

// Create a new bot instance
const bot = new TelegramBot(token, { polling: true });

// Respond to the /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Hey! 👋 Send me a Pinterest video link, and I’ll try to fetch it.');
});
