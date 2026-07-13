import http from 'http';

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      process.exit(0);
    } else {
      console.error(`Healthcheck failed with code: ${res.statusCode}. Payload: ${body}`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Healthcheck probe failed to connect:', err.message);
  process.exit(1);
});

req.end();
