const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'tunnel_url.txt');

(async () => {
  try {
    fs.writeFileSync(logFile, 'Starting...');
    const tunnel = await localtunnel({ port: 5173 });
    fs.writeFileSync(logFile, tunnel.url);
    console.log('Tunnel URL:', tunnel.url);
  } catch (err) {
    fs.writeFileSync(logFile, 'Error: ' + err.toString());
    console.error(err);
  }
})();
