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
        image: `ipfs://bafybeids7ta2frdol2tctrze5iuhbbbf7767oi6igbob4zpdvcnsmdehrm/${item.image}.png`,
        content_url: `ipfs://bafybeia63qfndn2y4iksq43md5udzxt4d7wkkl4mylcalg54lj2gylxugm/${item.image}.mp4`,
        content_type: 'video/mp4',
        description: `This is not just a collection, it's a pioneering exploration in the realm of compression-based generative art, a first of its kind. Everything together creates a unique atmosphere of the night experience.\n\nThis pieces represents a groundbreaking foray into generative multimedia, where a symphony of intricate sounds is the foundation for crafting visuals. Each image emerges, intricately woven and compressed from this auditory tapestry, offering an unparalleled fusion of sensory experiences.\n\nThe sheer magnitude of knowledge is staggering in the variability of being. Always and in everything. Observing, it is reflected in us, your favorite attention wrappers. Night №${
          index + 1
        } by Kirill Ateev.`,
      };

      // Convert the updated object to JSON
      const updatedItemJson = JSON.stringify(updatedItem, null, 2);

      // Write the JSON to a separate file in the output folder
      const outputFile = path.join(outputFolder, `${index}.json`);
      fs.writeFileSync(outputFile, updatedItemJson, 'utf8');
    });

    console.log('Files written successfully.');
  } catch (error) {
    console.error(`Error parsing JSON: ${error}`);
  }
});
