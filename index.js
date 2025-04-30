require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const got = require('got');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 Hi! Send me a Pinterest video link and I'll try to download it for you.");
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.startsWith('/')) return;

  if (text.includes("pin.it") || text.includes("pinterest.com")) {
    bot.sendMessage(chatId, "📎 Got a Pinterest link, fetching video...");

    const videoUrl = await fetchPinterestVideo(text);

    if (videoUrl) {
      bot.sendMessage(chatId, "📽️ Found the video! Sending it now...");

      bot.sendVideo(chatId, videoUrl).catch(err => {
        bot.sendMessage(chatId, "⚠️ Error sending video. It might be too large.");
        console.error("Telegram send error:", err.message);
      });
    } else {
      bot.sendMessage(chatId, "❌ Couldn't find a video on that link.");
    }
  }
});

async function fetchPinterestVideo(url) {
  try {
    const response = await got(url, {
      timeout: { request: 15000 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
      }
    });

    const html = response.body;
    const match = html.match(/"contentUrl":"(https:\/\/[^"]+\.mp4)"/);

    return match ? match[1] : null;
  } catch (error) {
    console.error("Error fetching Pinterest video:", error.message);
    return null;
  }
}
