// Test login endpoints with actual HTTP requests
const fetch = require('node-fetch');

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

async function testLogin(endpoint, email, password, role) {
  try {
    console.log(`\n🔍 Testing ${role} login...`);
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Email: ${email}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok && (data.success || data.token || data.user)) {
      console.log(`   ✅ Login successful!`);
      if (data.token) console.log(`   Token: ${data.token.substring(0, 20)}...`);
      if (data.user) console.log(`   User: ${data.user.email} (${data.user.role})`);
      if (data.data) console.log(`   Candidate: ${data.data.email}`);
      return true;
    } else {
      console.log(`   ❌ Login failed: ${data.message || data.error || 'Unknown error'}`);
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`   ⚠️  Backend server is not running on ${BASE_URL}`);
      console.log(`   💡 Start the backend: cd apps/backend && npm start`);
    }
    return false;
  }
}

async function testAllLogins() {
  console.log('🧪 Testing All Login Endpoints\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  const results = {
    admin: await testLogin('/auth/login', 'admin@fwcit.com', 'admin123', 'ADMIN'),
    hr: await testLogin('/auth/login', 'hr@fwchrms.com', 'HR@2024!', 'HR'),
    manager: await testLogin('/auth/login', 'manager@fwcit.com', 'manager123', 'MANAGER'),
    employee: await testLogin('/auth/login', 'employee@fwcit.com', 'employee123', 'EMPLOYEE'),
    candidate: await testLogin('/candidates/login', 'candidate.demo@mastersolisinfotech.com', 'candidate123', 'CANDIDATE')
  };

  console.log('\n📊 Results Summary:\n');
  console.log(`ADMIN:    ${results.admin ? '✅' : '❌'}`);
  console.log(`HR:       ${results.hr ? '✅' : '❌'}`);
  console.log(`MANAGER:  ${results.manager ? '✅' : '❌'}`);
  console.log(`EMPLOYEE: ${results.employee ? '✅' : '❌'}`);
  console.log(`CANDIDATE: ${results.candidate ? '✅' : '❌'}`);

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 All logins working!');
  } else {
    console.log('\n⚠️  Some logins failed. Check backend server is running.');
  }

  process.exit(allPassed ? 0 : 1);
}

testAllLogins();

