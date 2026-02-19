const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const logoPath = path.join(__dirname, 'public', 'mtrx-logo.jpg');
const outputPath = path.join(__dirname, 'public', 'mtrx-logo-trimmed.jpg');

console.log(`Input: ${logoPath}`);
console.log(`Output: ${outputPath}`);

sharp(logoPath)
  .trim()
  .toFile(outputPath, (err, info) => {
    if (err) {
      console.error('Error:', err);
      fs.writeFileSync('trim-error.txt', err.toString());
    } else {
      console.log('Success:', info);
      fs.writeFileSync('trim-success.txt', JSON.stringify(info));
    }
  });
