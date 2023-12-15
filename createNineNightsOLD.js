const fs = require('fs');
const { AudioContext, AudioBuffer } = require('web-audio-api');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const { createCanvas } = require('canvas');

const audioContext = new AudioContext();

ffmpeg.setFfmpegPath(ffmpegPath);

function generateRainSound(duration, intensity) {
  const bufferSize = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(
    2,
    bufferSize,
    audioContext.sampleRate
  );
  const dataL = buffer.getChannelData(0);
  const dataR = buffer.getChannelData(1);

  const baseFrequency = 200 + Math.random() * 200;
  const frequencyVariation = 50 + Math.random() * 50;
  const baseAmplitude = (intensity + Math.random() * 0.2) * 0.6;
  const amplitudeVariation = intensity * 0.2 + Math.random() * 0.1;

  let t = 0;
  let amplitude = baseAmplitude + (Math.random() * 2 - 1) * amplitudeVariation;
  let frequency = baseFrequency + (Math.random() * 2 - 1) * frequencyVariation;

  const raindropVolume = intensity * 0.2 + Math.random() * 0.1;
  const pitterPatterVolume = intensity * 0.1 + Math.random() * 0.06;
  const rumbleVolume = intensity * 0.1 + Math.random() * 0.06;
  const lightningVolume = intensity * 0.2 + Math.random() * 0.1;

  let isLightning = false;
  let lightningStart = 0;
  let lightningDuration = 0;
  let lightningAmplitude = 0;

  for (let i = 0; i < bufferSize; i++) {
    // Rain sounds
    const raindrop = raindropVolume * Math.sin(2 * Math.PI * frequency * t);
    const pitterPatter =
      pitterPatterVolume *
      Math.sin(2 * Math.PI * (frequency + 500 * Math.random()) * t);
    const rumble =
      rumbleVolume *
      (Math.sin(2 * Math.PI * 50 * t) + Math.sin(2 * Math.PI * 30 * t));

    // Lightning sounds
    if (isLightning) {
      const timeSinceLightning = t - lightningStart;
      if (timeSinceLightning < lightningDuration) {
        const lightning =
          lightningAmplitude *
          Math.sin(
            2 * Math.PI * (400 + 800 * Math.random()) * timeSinceLightning
          );
        dataL[i] = (raindrop + pitterPatter + rumble + lightning) * amplitude;
        dataR[i] =
          (raindrop + pitterPatter + rumble + lightning) * amplitude * 0.8;
        continue;
      } else {
        isLightning = false;
      }
    }

    dataL[i] = (raindrop + pitterPatter + rumble) * amplitude;
    dataR[i] = (raindrop + pitterPatter + rumble) * amplitude * 0.8;

    t += 1 / audioContext.sampleRate;

    if (Math.random() < 0.05) {
      amplitude = baseAmplitude + (Math.random() * 2 - 1) * amplitudeVariation;
    }
    if (Math.random() < 0.1) {
      frequency = baseFrequency + (Math.random() * 2 - 1) * frequencyVariation;
    }

    // Generate lightning randomly
    if (!isLightning && Math.random() < 0.02) {
      isLightning = true;
      lightningStart = t;
      lightningDuration = 0.05 + Math.random() * 0.2;
      lightningAmplitude = lightningVolume * (0.5 + Math.random() * 0.5);
    }
  }

  return buffer;
}

function encodeWAV(buffer) {
  if (!(buffer instanceof AudioBuffer)) {
    throw new Error('Argument must be an instance of AudioBuffer');
  }

  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample * numChannels;
  const totalLength = buffer.length * blockAlign;

  const arrayBuffer = new ArrayBuffer(44 + totalLength);
  const dataView = new DataView(arrayBuffer);

  writeString(dataView, 0, 'RIFF');
  dataView.setUint32(4, 36 + totalLength, true);
  writeString(dataView, 8, 'WAVE');
  writeString(dataView, 12, 'fmt ');
  dataView.setUint32(16, 16, true);
  dataView.setUint16(20, 1, true);
  dataView.setUint16(22, numChannels, true);
  dataView.setUint32(24, sampleRate, true);
  dataView.setUint32(28, sampleRate * blockAlign, true);
  dataView.setUint16(32, blockAlign, true);
  dataView.setUint16(34, 16, true);
  writeString(dataView, 36, 'data');
  dataView.setUint32(40, totalLength, true);

  const bufferView = new DataView(arrayBuffer, 44);
  for (let i = 0; i < buffer.length; i++) {
    const index = i * blockAlign;
    const sample = Math.floor(buffer.getChannelData(0)[i] * 32767);
    bufferView.setInt16(index, sample, true);
  }

  return arrayBuffer;
}

function writeString(dataView, offset, string) {
  for (let i = 0; i < string.length; i++) {
    dataView.setUint8(offset + i, string.charCodeAt(i));
  }
}

function generateImageFromSound(buffer, fileName) {
  const width = 512;
  const height = 512;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const noiseBlockSize = 16; // Increased block size for noise pattern

  const patternChoice = buffer.getChannelData(0)[0];
  if (patternChoice < 0.25) {
    // Noise Pattern
    for (let x = 0; x < width; x += noiseBlockSize) {
      for (let y = 0; y < height; y += noiseBlockSize) {
        const randomFactor =
          (buffer.getChannelData(0)[(x + y) % buffer.length] + 1) / 2;
        const noiseRed = Math.floor(randomFactor * Math.random() * 256);
        const noiseGreen = Math.floor(randomFactor * Math.random() * 256);
        const noiseBlue = Math.floor(randomFactor * Math.random() * 256);

        for (let i = 0; i < noiseBlockSize; i++) {
          for (let j = 0; j < noiseBlockSize; j++) {
            const index = ((y + j) * width + (x + i)) * 4;
            data[index] = noiseRed;
            data[index + 1] = noiseGreen;
            data[index + 2] = noiseBlue;
            data[index + 3] = 255;
          }
        }
      }
    }
  } else if (patternChoice < 0.5) {
    // Stripe Pattern with increased width
    const stripeWidth = Math.floor(
      40 + 80 * Math.abs(buffer.getChannelData(0)[1])
    );
    for (let x = 0; x < width; x++) {
      const colorFactor = (buffer.getChannelData(0)[x % buffer.length] + 1) / 2;
      const isStripe = Math.floor(x / stripeWidth) % 2 === 0;
      for (let y = 0; y < height; y++) {
        const index = (y * width + x) * 4;
        if (isStripe) {
          data[index] = Math.floor(colorFactor * 256);
          data[index + 1] = Math.floor((1 - colorFactor) * 256);
          data[index + 2] = Math.floor(colorFactor * Math.random() * 256);
        } else {
          data[index] = data[index + 1] = data[index + 2] = 128; // Gray for non-stripe areas
        }
        data[index + 3] = 255;
      }
    }
  } else if (patternChoice < 0.75) {
    // Gradient Pattern remains unchanged
    const gradientStart = Math.floor(
      256 * Math.abs(buffer.getChannelData(0)[2])
    );
    const gradientEnd = Math.floor(256 * Math.abs(buffer.getChannelData(0)[3]));
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const index = (y * width + x) * 4;
        const gradientValue =
          gradientStart + (gradientEnd - gradientStart) * (y / height);
        data[index] = data[index + 1] = data[index + 2] = gradientValue;
        data[index + 3] = 255;
      }
    }
  } else {
    // Circle Pattern with increased radius
    const centerX = width * Math.abs(buffer.getChannelData(0)[4]);
    const centerY = height * Math.abs(buffer.getChannelData(0)[5]);
    const radius = 150 + 300 * Math.abs(buffer.getChannelData(0)[6]);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const index = (y * width + x) * 4;
        const distanceToCenter = Math.sqrt(
          (x - centerX) ** 2 + (y - centerY) ** 2
        );
        if (distanceToCenter < radius) {
          data[index] = Math.floor(
            256 * Math.abs(buffer.getChannelData(0)[x % buffer.length])
          );
          data[index + 1] = Math.floor(
            256 * Math.abs(buffer.getChannelData(0)[y % buffer.length])
          );
          data[index + 2] = Math.floor(
            256 * Math.abs(buffer.getChannelData(0)[(x + y) % buffer.length])
          );
        } else {
          data[index] = data[index + 1] = data[index + 2] = 128; // Gray for outside the circle
        }
        data[index + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const imageBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`images/${fileName}.png`, imageBuffer);
  return `images/${fileName}.png`;
}

async function generateRainSounds(numSounds, duration, intensity) {
  const output = [];

  for (let i = 1; i <= numSounds; i++) {
    const buffer = generateRainSound(duration, intensity);
    const arrayBuffer = encodeWAV(buffer);

    const soundFileName = `rain-${i}.wav`;
    await new Promise((resolve, reject) => {
      fs.writeFile(
        `sounds/${soundFileName}`,
        Buffer.from(arrayBuffer),
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });

    const imageFilePath = generateImageFromSound(buffer, `rain-${i}`);

    const webmFileName = `rain-${i}.webm`;
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(`sounds/${soundFileName}`)
        .inputFPS(0) // Reduced frame rate
        .input(imageFilePath)
        .audioBitrate(1) // Reduced audio bitrate
        .videoBitrate(1) // Reduced video bitrate
        .size('1280x1280') // Reduced resolution
        .toFormat('webm')
        .on('end', resolve)
        .on('error', reject)
        .save(`webm/${webmFileName}`);
    });

    output.push({
      description: `This is sound #${i}`,
      image: imageFilePath,
      name: `All my radost ${i}`,
      attributes: [
        { trait_type: 'Volume', value: '9' },
        { trait_type: 'BPM', value: '50' },
        { trait_type: 'Signal', value: 'Surprise' },
      ],
    });

    console.log(`Generated ${soundFileName}`);
  }

  fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
}

generateRainSounds(8, 3, 0.1)
  .then(() => console.log('Done'))
  .catch((err) => console.error(err));
