const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfprobePath(ffprobePath);
ffmpeg.setFfmpegPath(ffmpegPath);

const maxFilesToProcess = 88;
const videoDir = 'webm'; // Directory where your videos are stored
const outputDir = 'videoScreens'; // Directory where you want to save the frames

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// try {
//   const files = fs.readdirSync(videoDir);

//   // Process only the first 88 files
//   files.slice(0, 88).forEach((file) => {
//     const inputPath = `${videoDir}/${file}`;
//     const outputPath = `${outputDir}/${file
//       .split('.')
//       .slice(0, -1)
//       .join('.')}.jpg`;

//     ffmpeg(inputPath)
//       .on('end', () => {
//         console.log(`Finished processing ${file}`);
//       })
//       .on('error', (err) => {
//         console.error(`Error processing ${file}:`, err);
//       })
//       .screenshots({
//         timestamps: ['00:00:01'],
//         filename: outputPath,
//         folder: outputDir,
//         size: '128x128',
//       });
//   });
// } catch (err) {
//   console.error('Error reading the directory', err);
// }

async function start() {
  const j = 888;
  for (let i = 1; i <= j; i++) {
    // wait for the promise to resolve before advancing the for loop
    await new Promise((resolve, reject) => {
      ffmpeg(`./webm/${i}.mp4`)
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
