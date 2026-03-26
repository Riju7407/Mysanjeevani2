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

    if (body) {
      const jsonBody = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(jsonBody);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: responseBody
        });
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error.code, error.message);
      resolve({
        status: 0,
        body: `Error: ${error.code} - ${error.message}`
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('MySanjeevani Auth API Tests');
  console.log('='.repeat(60));
  
  // Test Signup
  console.log('\n📝 Testing Signup API...\n');
  const signupEmail = `test${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', 'POST', {
    email: signupEmail,
    password: 'Test@123456',
    fullName: 'Test User'
  });
  
  console.log(`Status: ${signupRes.status}`);
  console.log(`Response: ${signupRes.body}\n`);
  
  // Test Login
  console.log('🔐 Testing Login API...\n');
  const loginRes = await makeRequest('/api/auth/login', 'POST', {
    email: signupEmail,
    password: 'Test@123456'
  });
  
  console.log(`Status: ${loginRes.status}`);
  console.log(`Response: ${loginRes.body}\n`);
  
  console.log('='.repeat(60));
  console.log('Test Summary:');
  console.log(`Signup: ${signupRes.status === 201 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Login: ${loginRes.status === 200 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('='.repeat(60));
  
  process.exit(0);
}

runTests();
