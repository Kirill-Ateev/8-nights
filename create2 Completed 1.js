const fs = require('fs');
const { AudioContext, AudioBuffer } = require('web-audio-api');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const { createCanvas, Image } = require('canvas');

const audioContext = new AudioContext();

ffmpeg.setFfmpegPath(ffmpegPath);

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const notesFrequencies = [
  ['C3', 130.81],
  ['D3', 146.83],
  ['E3', 164.81],
  ['F3', 174.61],
  ['G3', 196.0],
  ['A3', 220.0],
  ['B3', 246.94],
  ['C4', 261.63],
  ['D4', 293.66],
  ['E4', 329.63],
  ['F4', 349.23],
  ['G4', 392.0],
  ['A4', 440.0],
  ['B4', 493.88],
  ['C5', 523.25],
];

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

function generateSound(duration, intensity) {
  const bufferSize = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(
    2,
    bufferSize,
    audioContext.sampleRate
  );
  const dataL = buffer.getChannelData(0);
  const dataR = buffer.getChannelData(1);

  const baseAmplitude = parseFloat(
    ((intensity + Math.random() * 0.1) * 0.5).toFixed(1)
  );
  const amplitudeVariation = Math.abs(
    parseFloat((intensity * 0.1 + Math.random() * 0.5).toFixed(1))
  );

  let t = 0;
  let amplitude = baseAmplitude + (Math.random() * 2 - 1) * amplitudeVariation;

  let currentNoteDuration = 0;
  let currentNoteFrequency = 0;

  const audioBitrate = randomIntFromInterval(5, 100);

  // { trait_type: 'Intensity', value: '8' },
  // { trait_type: 'Noise amount', value: '9' },
  // { trait_type: 'Duration', value: '8' },
  // { trait_type: 'Amplitude', value: '50' },
  // { trait_type: 'Amplitude variation', value: '8' },
  const traits = {
    intensity,
    noise: 0,
    duration,
    amplitude: baseAmplitude,
    amplitudeVariation,
    audioBitrate,
  };

  for (let i = 0; i < bufferSize; i++) {
    if (currentNoteDuration <= 0) {
      // Randomly decide between noise and a note
      if (Math.random() < 0.2) {
        traits.noise = traits.noise + 1;
        // 20% chance of noise
        currentNoteFrequency = 'noise';
        currentNoteDuration =
          audioContext.sampleRate * (0.1 + Math.random() * 0.25); // Noise duration between 0.1 to 0.25 seconds
      } else {
        const noteIndex = randomIntFromInterval(0, notesFrequencies.length - 1);
        // Randomly select a new note from our expanded scale
        currentNoteFrequency = notesFrequencies[noteIndex][1];
        const note = notesFrequencies[noteIndex][0];

        traits[note] = traits[note] ? traits[note] + 1 : 1;
        // Randomly determine the duration for this note (between 0.2 to 0.5 seconds)
        currentNoteDuration =
          audioContext.sampleRate * (0.15 + Math.random() * 0.3);
      }
    }

    // Добавить дополнительные эффекты, возможно еще голос. Возможно голос из моих стихов
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

  return { buffer, traits };
}

function generateImageFromSound(buffer, fileName) {
  const factor = 1;
  const width = 512 * factor;
  const height = 512 * factor;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const noiseBlockSize = 16; // Increased block size for noise pattern

  // Noise Pattern
  for (let x = 0; x < width; x += noiseBlockSize) {
    for (let y = 0; y < height; y += noiseBlockSize) {
      const randomFactor =
        (buffer.getChannelData(0)[randomIntFromInterval(0, width)] + 1) / 2;
      let noiseRed = Math.floor(randomFactor * Math.random() * 256);
      let noiseGreen = Math.floor(randomFactor * Math.random() * 256);
      let noiseBlue = Math.floor(randomFactor * Math.random() * 256);

      for (let i = 0; i < noiseBlockSize; i++) {
        for (let j = 0; j < noiseBlockSize; j++) {
          const index = ((y + j) * width + (x + i)) * 4;
          data[index] = noiseRed * 0.8;
          data[index + 1] = noiseGreen * 0.7;
          data[index + 2] = noiseBlue;

          if (
            [noiseRed, noiseGreen, noiseBlue].filter((value) => value > 200)
              .length >= 2
          ) {
            data[index] = noiseRed;
            data[index + 1] = noiseGreen;
            data[index + 2] = noiseBlue;
            data[index + 3] = 150;
          } else if (
            [noiseRed, noiseGreen, noiseBlue].filter((value) => value > 150)
              .length >= 2
          ) {
            data[index] = noiseRed;
            data[index + 1] = noiseGreen;
            data[index + 2] = noiseBlue;
            data[index + 3] = 170;
          } else if (
            [noiseRed, noiseGreen, noiseBlue].filter((value) => value > 100)
              .length >= 2
          ) {
            data[index] = noiseRed;
            data[index + 1] = noiseGreen;
            data[index + 2] = noiseBlue;
            data[index + 3] = 200;
          } else if (
            [noiseRed, noiseGreen, noiseBlue].filter((value) => value < 30)
              .length >= 2
          ) {
            data[index] = noiseRed + 40;
            data[index + 1] = noiseGreen + 40;
            data[index + 2] = noiseBlue + 40;
            data[index + 3] = 240;
          } else {
            data[index + 3] = 240;
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0); // Put the noise pattern on the canvas

  const quality = parseFloat((Math.random() * (1 - 0.1) + 0.1).toFixed(1));

  // Save as JPEG with low quality to introduce compression artifacts
  const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: quality });

  // Load the JPEG buffer back to canvas
  const img = new Image();
  img.src = jpegBuffer;
  ctx.drawImage(img, 0, 0, width, height);

  // Save as PNG
  const imageBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`images/${fileName}.png`, imageBuffer);
  return { imageFilePath: `images/${fileName}.png`, quality };
}

async function generateRainVideos(numSounds, duration) {
  const output = [];

  for (let i = 1; i <= numSounds; i++) {
    const intensity = randomIntFromInterval(-8, 8);
    const duration = randomIntFromInterval(1, 8);
    const { buffer, traits } = generateSound(duration, intensity);
    const arrayBuffer = encodeWAV(buffer);

    const soundFileName = `${i}.wav`;
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

    const { imageFilePath, quality } = generateImageFromSound(buffer, `${i}`);

    const webmFileName = `${i}.mp4`;
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(`sounds/${soundFileName}`)
        .inputFPS(0) // Reduced frame rate further
        .input(imageFilePath)
        .audioBitrate(traits.audioBitrate) // Reduced audio bitrate
        .videoBitrate(1) // Reduced video bitrate
        .videoCodec('libvpx-vp9') // Use VP9 codec
        .size('128x128') // Further reduced resolution
        .toFormat('mp4')
        .on('end', resolve)
        .on('error', reject)
        .save(`webm/${webmFileName}`);
    });

    output.push({
      name: `Night №${i}`,
      image: i,
      description: `This is a generative multimedia collection of sounds from which the picture is generated and compressed. Everything together creates a unique atmosphere of the night experience. Night shards crumbs settle in the consciousness. The sheer magnitude of knowledge is staggering in the variability of being. Always and in everything. Observing, it is reflected in us, your favorite attention wrappers. Night №${i} by bgdshka`,
      attributes: [
        {
          trait_type: 'Extra image compress quality percent',
          value: `${quality * 100}`,
        },
        {
          trait_type: 'Audio bitrate',
          value: `${traits.audioBitrate}`,
        },
        { trait_type: 'Intensity', value: `${traits.intensity}` },
        { trait_type: 'Noise amount', value: `${traits.noise}` },
        { trait_type: 'Duration', value: `${traits.duration}` },
        { trait_type: 'Amplitude', value: `${traits.amplitude}` },
        {
          trait_type: 'Amplitude variation',
          value: `${traits.amplitudeVariation}`,
        },
        ...Object.entries(traits).reduce((acc, [name, value]) => {
          const notes = notesFrequencies.map(
            ([noteName, noteFreq]) => noteName
          );
          if (notes.includes(name))
            return [
              ...acc,
              { trait_type: `${name} note amount`, value: `${value}` },
            ];
          else return acc;
        }, []),
      ],
    });

    console.log(`Generated ${soundFileName}`);
  }

  fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
}

generateRainVideos(888)
  .then(() => console.log('Done'))
  .catch((err) => console.error(err));

//Metadata description
// It is a generative multimedia collection of sounds from which the picture is generated and compressed. Everything together creates a unique atmosphere of the night experience.
