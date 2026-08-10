const localtunnel = require('localtunnel');
(async () => {
  try {
    console.log('Requesting tunnel...');
    const tunnel = await localtunnel({ port: 4173 });
    console.log('Tunnel created:', tunnel.url);
  } catch (err) {
    console.error('Error creating tunnel:', err);
  }
})();
