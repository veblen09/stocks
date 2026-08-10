const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const outFile = path.join(__dirname, 'public_url.txt');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 5173 });
    const url = tunnel.url;
    fs.writeFileSync(outFile, url);
    console.log('PUBLIC_URL:' + url);
    
    tunnel.on('close', () => {
      console.log('tunnel closed');
    });
  } catch (err) {
    fs.writeFileSync(outFile, 'Error: ' + err.message);
    console.error(err);
  }
})();
