const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

ffmpeg.setFfprobePath(ffprobePath);
ffmpeg.setFfmpegPath(ffmpegPath);

const outputDir = 'videoScreens'; // Directory where you want to save the frames

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function start() {
  const j = 888;
  for (let i = 1; i <= j; i++) {
    // wait for the promise to resolve before advancing the for loop
    await new Promise((resolve, reject) => {
      ffmpeg(`./video/${i}.mp4`)
        .on('end', (files) => {
          console.log(`Finished processing!` + files);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error processing!`, err);
          reject();
        })
        .screenshots({
          timestamps: [0],
          filename: `${i}.png`,
          folder: './videoScreens',
          size: '128x128',
        });
    });
    console.log('Complete for ' + i);
  }
}

start();
