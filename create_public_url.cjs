const localtunnel = require('localtunnel');
const fs = require('fs');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 5173 });
    fs.writeFileSync('public_link.txt', tunnel.url);
    console.log('PUBLIC_URL_ESTABLISHED:' + tunnel.url);
  } catch (err) {
    fs.writeFileSync('public_link.txt', 'Error:' + err.message);
  }
})();
