const fs = require('fs');
const path = require('path');

// Read the JSON file with an array of objects
const inputFile = 'output.json'; // Replace with your input file path
const outputFolder = 'output';

fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    return;
  }

  try {
    const jsonArray = JSON.parse(data);

    // Create the output folder if it doesn't exist
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }

    jsonArray.forEach((item, index) => {
      // Replace the image property
      const updatedItem = {
        ...item,
        image: `ipfs://bafybeia63qfndn2y4iksq43md5udzxt4d7wkkl4mylcalg54lj2gylxugm/${item.image}.mp4`,
        description: `This collection represents a groundbreaking foray into generative multimedia, where a symphony of intricate sounds is the foundation for crafting visuals. Each image emerges, intricately woven and compressed from this auditory tapestry, offering an unparalleled fusion of sensory experiences. This is not just a collection; it's a pioneering exploration in the realm of compression-based generative art, a first of its kind. Everything together creates a unique atmosphere of the night experience. Night shards crumbs settle in the consciousness. The sheer magnitude of knowledge is staggering in the variability of being. Always and in everything. Observing, it is reflected in us, your favorite attention wrappers. Night №${
          index + 1
        } by bgdshka.`,
      };

      // Convert the updated object to JSON
      const updatedItemJson = JSON.stringify(updatedItem, null, 2);

      // Write the JSON to a separate file in the output folder
      const outputFile = path.join(outputFolder, `${index + 1}.json`);
      fs.writeFileSync(outputFile, updatedItemJson, 'utf8');
    });

    console.log('Files written successfully.');
  } catch (error) {
    console.error(`Error parsing JSON: ${error}`);
  }
});
