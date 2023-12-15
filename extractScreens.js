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
const number = 526;

ffmpeg(`./webm/${number}.mp4`)
  .on('end', (files) => {
    console.log(`Finished processing!` + files);
  })
  .on('error', (err) => {
    console.error(`Error processing!`, err);
  })
  .screenshots({
    timestamps: [0],
    filename: `${number}.png`,
    folder: './videoScreens',
    size: '128x128',
  });
