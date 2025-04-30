const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
const got = require('got');
require('dotenv').config();

// Initialize Bot with token from .env
const bot = new Telegraf(process.env.BOT_TOKEN);

// Function to handle video download and deletion
const downloadAndSendVideo = async (chatId, url) => {
  const videoFilePath = path.join(__dirname, 'temp_video.mp4');
  
  try {
    // Stream the video from the URL
    const videoStream = got.stream(url);
    
    // Write the stream to a file on the server
    const writeStream = fs.createWriteStream(videoFilePath);
    videoStream.pipe(writeStream);
    
    writeStream.on('finish', async () => {
      try {
        // Send the video to the user
        await bot.sendVideo(chatId, { source: videoFilePath });
        
        // After sending the video, delete the file
        fs.unlink(videoFilePath, (err) => {
          if (err) {
            console.error('Error deleting video:', err);
          } else {
            console.log('Video deleted successfully');
          }
        });
      } catch (sendError) {
        console.error('Error sending video:', sendError);
      }
    });

    writeStream.on('error', (err) => {
      console.error('Error writing file:', err);
    });

  } catch (err) {
    console.error('Error fetching video:', err);
    bot.telegram.sendMessage(chatId, 'Sorry, there was an error fetching the video. Please try again later.');
  }
};

// Start bot and listen for user messages
bot.start((ctx) => {
  ctx.reply('Welcome! Send a Pinterest video link to download the video.');
});

// Handle user messages with Pinterest video links
bot.on('text', (ctx) => {
  const chatId = ctx.chat.id;
  const url = ctx.message.text;

  if (url && url.includes('pin.it')) {
    ctx.reply('Got Pinterest link, fetching video...');
    
    // Call the function to download and send the video
    downloadAndSendVideo(chatId, url);
  } else {
    ctx.reply('Please send a valid Pinterest video link.');
  }
});

// Handle errors
bot.on('error', (err) => {
  console.error('Error with bot:', err);
  bot.telegram.sendMessage(chatId, 'Something went wrong! Please try again later.');
});

// Start the bot
bot.launch();
