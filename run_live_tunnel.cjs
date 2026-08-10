const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const outFile = path.join(__dirname, 'live_url.txt');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 5173 });
    fs.writeFileSync(outFile, tunnel.url);
    console.log('LIVE_URL_READY:' + tunnel.url);
  } catch (err) {
    fs.writeFileSync(outFile, 'ERR:' + err.message);
  }
})();
