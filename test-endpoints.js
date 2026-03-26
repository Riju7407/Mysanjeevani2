const http = require('http');

function testEndpoint(path, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          name,
          status: res.statusCode,
          success: res.statusCode === 200,
          body: body.substring(0, 100)
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name,
        status: 0,
        error: error.code,
        success: false
      });
    });

    req.setTimeout(5000);
    req.end();
  });
}

async function test() {
  console.log('Testing MySanjeevani API\n');
  
  const results = await Promise.all([
    testEndpoint('/', 'Homepage'),
    testEndpoint('/api/health', 'Health Check'),
  ]);

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.status} ${r.error ? `(${r.error})` : ''}`);
  });

  process.exit(0);
}

setTimeout(test, 2000);
