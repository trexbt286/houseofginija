const https = require('https');
const payload = JSON.stringify({
  name: 'houseofginija_settings',
  data: {
    jewellery_enabled: 'false',
    flash_sale_enabled: 'true',
    new_arrivals_enabled: 'true'
  }
});

const req = https.request({
  hostname: 'api.restful-api.dev',
  path: '/objects/ff8081819f7e10ae019fe4dfde521444',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Successfully set cloud settings: jewellery_enabled = false!');
    console.log('Response:', body);
  });
});

req.write(payload);
req.end();
