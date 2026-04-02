const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const localEnv = parseEnvFile(path.join(process.cwd(), '.env.local'));
const mongoUri = process.env.MONGODB_URI || localEnv.MONGODB_URI;
const otpTestMode = (process.env.OTP_TEST_MODE || localEnv.OTP_TEST_MODE || '').toLowerCase() === 'true';

async function apiRequest(endpoint, method = 'POST', body = null) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return {
    status: response.status,
    data,
  };
}

function randomPhone() {
  const suffix = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `+91${suffix}`;
}

function randomEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;
}

async function ensureUser(phone, tag) {
  const signup = await apiRequest('/api/auth/signup', 'POST', {
    email: randomEmail(tag),
    password: 'Test@123456',
    fullName: `OTP ${tag} User`,
    phone,
    fullAddress: 'Test Address',
    role: 'user',
  });

  if (![201, 409].includes(signup.status)) {
    throw new Error(`Signup failed for ${tag}: ${signup.status} ${JSON.stringify(signup.data)}`);
  }
}

async function forceExpireLatestOtp(phone) {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required to force-expire OTP for test');
  }

  const connection = await mongoose.createConnection(mongoUri).asPromise();
  try {
    const collection = connection.collection('phoneotps');
    await collection.updateOne(
      { phone: phone.replace(/\D/g, ''), role: 'user' },
      { $set: { expiresAt: new Date(Date.now() - 60 * 1000) } },
      { sort: { createdAt: -1 } }
    );
  } finally {
    await connection.close();
  }
}

async function run() {
  const results = [];

  if (!otpTestMode) {
    console.error('OTP_TEST_MODE=true is required for deterministic OTP tests.');
    process.exit(1);
  }

  const validOtp = '123456';

  // 1) send/verify success
  const phoneSuccess = randomPhone();
  await ensureUser(phoneSuccess, 'success');

  const sendSuccess = await apiRequest('/api/auth/phone/send-otp', 'POST', {
    phone: phoneSuccess,
    role: 'user',
  });
  results.push({
    name: 'send-otp success',
    passed: sendSuccess.status === 200,
    details: sendSuccess,
  });

  const verifySuccess = await apiRequest('/api/auth/phone/verify-otp', 'POST', {
    phone: phoneSuccess,
    role: 'user',
    otp: validOtp,
  });
  results.push({
    name: 'verify-otp success',
    passed: verifySuccess.status === 200,
    details: verifySuccess,
  });

  // 2) not registered
  const notRegistered = await apiRequest('/api/auth/phone/send-otp', 'POST', {
    phone: randomPhone(),
    role: 'user',
  });
  results.push({
    name: 'send-otp number not registered',
    passed:
      notRegistered.status === 404 &&
      String(notRegistered.data.error || '').toLowerCase() === 'number not registered'.toLowerCase(),
    details: notRegistered,
  });

  // 3) invalid OTP
  const phoneInvalid = randomPhone();
  await ensureUser(phoneInvalid, 'invalid');

  const sendForInvalid = await apiRequest('/api/auth/phone/send-otp', 'POST', {
    phone: phoneInvalid,
    role: 'user',
  });

  const verifyInvalid = await apiRequest('/api/auth/phone/verify-otp', 'POST', {
    phone: phoneInvalid,
    role: 'user',
    otp: '000000',
  });

  results.push({
    name: 'verify-otp invalid otp',
    passed:
      sendForInvalid.status === 200 &&
      verifyInvalid.status === 401 &&
      String(verifyInvalid.data.error || '').toLowerCase().includes('invalid or expired otp'),
    details: verifyInvalid,
  });

  // 4) expired OTP
  const phoneExpired = randomPhone();
  await ensureUser(phoneExpired, 'expired');

  const sendForExpired = await apiRequest('/api/auth/phone/send-otp', 'POST', {
    phone: phoneExpired,
    role: 'user',
  });

  if (sendForExpired.status === 200) {
    await forceExpireLatestOtp(phoneExpired);
  }

  const verifyExpired = await apiRequest('/api/auth/phone/verify-otp', 'POST', {
    phone: phoneExpired,
    role: 'user',
    otp: validOtp,
  });

  results.push({
    name: 'verify-otp expired otp',
    passed:
      sendForExpired.status === 200 &&
      verifyExpired.status === 401 &&
      String(verifyExpired.data.error || '').toLowerCase().includes('invalid or expired otp'),
    details: verifyExpired,
  });

  console.log('='.repeat(72));
  console.log('Phone OTP API Tests');
  console.log('='.repeat(72));

  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'}  ${result.name}`);
    if (!result.passed) {
      console.log(`      status=${result.details.status} body=${JSON.stringify(result.details.data)}`);
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log('='.repeat(72));
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('='.repeat(72));

  process.exit(failedCount === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error('Test run failed:', error);
  process.exit(1);
});
