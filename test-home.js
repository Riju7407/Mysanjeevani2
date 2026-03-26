const http = require('http');

function testHomepage() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          success: res.statusCode === 200
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.code,
        success: false
      });
    });

    req.end();
  });
}

async function test() {
  console.log('Testing Homepage Connection...\n');
  const result = await testHomepage();
  console.log(`Status: ${result.status}`);
  console.log(`Success: ${result.success}`);
  if (result.error) console.log(`Error: ${result.error}`);
  process.exit(0);
}

test();
