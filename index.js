require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const got = require('got');  // Correctly import got for v11.x and above

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Hey! 👋 Send me a Pinterest video link, and I’ll try to fetch it.');
});

// Listen to all messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/start')) return;

  const pinterestRegex = /(https?:\/\/)?(www\.)?(pinterest\.com|pin\.it)\/[^\s]+/;

  if (pinterestRegex.test(text)) {
    bot.sendMessage(chatId, '📦 Got a Pinterest link! Fetching video...');

    // If it's a short pin.it link, follow the redirection
    if (text.includes('pin.it')) {
      try {
        // Use got to handle redirection, but make sure we are using the latest syntax
        const response = await got(text, {
          method: 'GET',
          followRedirect: true, // Automatically follow redirects
          maxRedirects: 5,      // Limit redirects to 5
        });

        // The full URL after redirection
        bot.sendMessage(chatId, '🔄 Redirect complete! Extracting the video now...');
        const fullUrl = response.url;
        console.log('Final URL:', fullUrl); // Log the final URL for debugging

        // Respond to the user
        bot.sendMessage(chatId, '💡 Now extracting the video...');

      } catch (error) {
        console.error('Error while fetching Pinterest URL:', error.message);
        bot.sendMessage(chatId, `❌ Failed to fetch the full URL. Error: ${error.message}`);
      }
    } else {
      bot.sendMessage(chatId, '✅ This is already a full Pinterest link! Extracting video...');
      console.log('Full URL received:', text);
      bot.sendMessage(chatId, '💡 Now extracting the video...');
    }
  } else {
    bot.sendMessage(chatId, '🤔 I only understand Pinterest links for now. Try sending one!');
  }
});
