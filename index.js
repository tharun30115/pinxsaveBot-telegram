require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const got = require('got');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 Hi! Send me a Pinterest video link and I'll try to download it for you.");
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  if (text.includes("pin.it") || text.includes("pinterest.com")) {
    bot.sendMessage(chatId, "📎 Got a Pinterest link, fetching video...");

    const videoUrl = await fetchPinterestVideo(text);

    if (videoUrl) {
      const tempFileName = `video_${Date.now()}.mp4`;
      const tempFilePath = path.join(__dirname, tempFileName);

      try {
        const response = await fetch(videoUrl);
        if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

        await streamPipeline(response.body, fs.createWriteStream(tempFilePath));

        // Check file size before sending (Telegram has size limits)
        const fileSizeInMB = fs.statSync(tempFilePath).size / (1024 * 1024);
        if (fileSizeInMB > 50) {
          bot.sendMessage(chatId, `⚠️ The video is too large to send on Telegram (>${fileSizeInMB.toFixed(2)} MB).`);
          fs.unlinkSync(tempFilePath);
          return;
        }

        await bot.sendVideo(chatId, tempFilePath);
      } catch (err) {
        bot.sendMessage(chatId, "⚠️ Failed to download or send the video.");
        console.error("Error:", err.message);
      } finally {
        // Clean up
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      }
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
