const { createCanvas } = require('canvas');
const fs = require('fs');
const { exec } = require('child_process');
const Speaker = require('speaker');
const wav = require('wav');
const path = require('path');

function generateSound() {
  const sampleRate = 44100; // Standard CD quality sample rate
  const duration = 2; // 2 seconds
  const frequency = 440; // 440 Hz - standard A4 note
  const amplitude = 32767; // Max amplitude for 16-bit audio

  const samples = new Int16Array(sampleRate * duration);

  for (let i = 0; i < samples.length; i++) {
    samples[i] =
      amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }

  // Convert Int16Array to Buffer
  const buffer = Buffer.from(samples.buffer);

  const writer = new wav.Writer({
    channels: 1,
    sampleRate: sampleRate,
    bitDepth: 16,
  });

  const soundPath = path.join(__dirname, './output/sound.wav');
  const fileStream = fs.createWriteStream(soundPath);
  writer.pipe(fileStream);
  writer.write(buffer);
  writer.end();

  // Once the file is written, read and play it
  fileStream.on('finish', () => {
    const readStream = fs.createReadStream(soundPath);
    const speaker = new Speaker({
      channels: 1,
      bitDepth: 16,
      sampleRate: sampleRate,
    });
    readStream.pipe(speaker);
  });

  // Return the attributes
  return {
    frequency: frequency,
    duration: duration,
    amplitude: amplitude,
  };
}

function generateImageFromSound(soundAttributes) {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  // Generate image based on sound attributes (this is a basic example)
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 200, 200);
  const imagePath = './output/image.png';
  const out = fs.createWriteStream(imagePath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  return imagePath;
}

function createWebM(soundPath, imagePath, outputPath) {
  exec(
    `ffmpeg -i ${soundPath} -i ${imagePath} -c:v libvpx -c:a libvorbis ${outputPath}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`WebM created: ${outputPath}`);
    }
  );
}

async function main() {
  const soundAttributes = await generateSound();
  const imagePath = generateImageFromSound(soundAttributes);
  const webmPath = './output/video.webm';
  createWebM('./output/sound.wav', imagePath, webmPath);

  const outputJSON = [
    {
      description: 'This is sound #1',
      image: imagePath,
      name: 'All my radost',
      attributes: Object.entries(soundAttributes).map(([key, value]) => ({
        trait_type: key,
        value: value.toString(),
      })),
    },
  ];

  fs.writeFileSync('./output/data.json', JSON.stringify(outputJSON, null, 2));
}

main();
