const http = require('http');

function makeRequest(path, method = 'POST', body = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          body: responseBody.substring(0, 200)
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        path,
        status: 0,
        error: error.code
      });
    });

    req.setTimeout(5000);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAPIs() {
  console.log('Testing MySanjeevani Auth APIs\n');
  
  const tests = [
    { path: '/', method: 'GET', name: 'Homepage' },
    { path: '/api/health', method: 'GET', name: 'Health Check' },
    { path: '/api/auth/signup', method: 'POST', name: 'Signup' },
    { path: '/api/auth/register', method: 'POST', name: 'Register' },
    { path: '/api/auth/login', method: 'POST', name: 'Login' },
    { path: '/api/products', method: 'GET', name: 'Products' },
    { path: '/api/cart', method: 'GET', name: 'Cart' },
    { path: '/api/orders', method: 'GET', name: 'Orders' },
  ];

  const results = await Promise.all(
    tests.map(t => makeRequest(t.path, t.method, t.method === 'POST' ? {email:'t@t.com',password:'test123'} : null))
  );

  results.forEach((r, i) => {
    const test = tests[i];
    const icon = r.status === 200 || r.status === 201 ? '✅' : r.status === 404 ? '❌' : '⚠️';
    console.log(`${icon} ${test.name.padEnd(20)} ${r.path.padEnd(30)} Status: ${r.status || 'Error'} ${r.error ? `(${r.error})` : ''}`);
  });

  process.exit(0);
}

setTimeout(testAPIs, 2000);
