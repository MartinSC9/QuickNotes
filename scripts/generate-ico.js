const { default: pngToIco } = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, '..', 'assets', 'icon.png');
const output = path.join(__dirname, '..', 'assets', 'icon.ico');

pngToIco(input)
  .then(buf => {
    fs.writeFileSync(output, buf);
    console.log('icon.ico created');
  })
  .catch(console.error);
