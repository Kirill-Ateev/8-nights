const fs = require('fs');
const { AudioContext, AudioBuffer } = require('web-audio-api');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const { createCanvas, Image } = require('canvas');

const audioContext = new AudioContext();

ffmpeg.setFfmpegPath(ffmpegPath);

const notesFrequencies = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
};

function generateRainSound(duration, intensity) {
  const bufferSize = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(
    2,
    bufferSize,
    audioContext.sampleRate
  );
  const dataL = buffer.getChannelData(0);
  const dataR = buffer.getChannelData(1);

  const baseAmplitude = (intensity + Math.random() * 0.1) * 0.5;
  const amplitudeVariation = intensity * 0.1 + Math.random() * 0.05;

  let t = 0;
  let amplitude = baseAmplitude + (Math.random() * 2 - 1) * amplitudeVariation;

  let currentNoteDuration = 0;
  let currentNoteFrequency = 0;

  for (let i = 0; i < bufferSize; i++) {
    if (currentNoteDuration <= 0) {
      // Randomly decide between noise and a note
      if (Math.random() < 0.2) {
        // 20% chance of noise
        currentNoteFrequency = 'noise';
        currentNoteDuration =
          audioContext.sampleRate * (0.1 + Math.random() * 0.2); // Noise duration between 0.05 to 0.15 seconds
      } else {
        // Randomly select a new note from our expanded scale
        currentNoteFrequency =
          Object.values(notesFrequencies)[Math.floor(Math.random() * 15)];
        // Randomly determine the duration for this note (between 0.2 to 0.5 seconds)
        currentNoteDuration =
          audioContext.sampleRate * (0.2 + Math.random() * 0.3);
      }
    }

    if (currentNoteFrequency === 'noise') {
      // Generate random noise
      dataL[i] = (Math.random() * 2 - 1) * amplitude;
      dataR[i] = (Math.random() * 2 - 1) * amplitude;
    } else {
      // Generate the sound for the current note
      dataL[i] = Math.sin(2 * Math.PI * currentNoteFrequency * t) * amplitude;
      dataR[i] = Math.sin(2 * Math.PI * currentNoteFrequency * t) * amplitude;
    }

    t += 1 / audioContext.sampleRate;
    currentNoteDuration--;
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

  ctx.putImageData(imageData, 0, 0); // Put the noise pattern on the canvas

  // Adding circles to the noise pattern
  const min = 1;
  const max = 5;
  const numCircles = Math.floor(Math.random() * (max - min + 1) + min);
  for (let i = 0; i < numCircles; i++) {
    const centerX = Math.random() * width;
    const centerY = Math.random() * height;
    const radius = Math.random() * 30 + 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
      Math.random() * 256
    )}, ${Math.floor(Math.random() * 256)}, 0.5)`;
    ctx.fill();
  }

  // Save as JPEG with low quality to introduce compression artifacts
  const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: 0.1 });

  // Load the JPEG buffer back to canvas
  const img = new Image();
  img.src = jpegBuffer;
  ctx.drawImage(img, 0, 0, width, height);

  // Save as PNG
  const imageBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`images/${fileName}.png`, imageBuffer);
  return `images/${fileName}.png`;
}

async function generateRainVideos(numSounds, duration, intensity) {
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
        .inputFPS(0) // Reduced frame rate further
        .input(imageFilePath)
        .audioBitrate(1) // Reduced audio bitrate
        .videoBitrate(1) // Reduced video bitrate
        .videoCodec('libvpx-vp9') // Use VP9 codec
        .size('128x128') // Further reduced resolution
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

generateRainVideos(8, 3, 0.1)
  .then(() => console.log('Done'))
  .catch((err) => console.error(err));
