#!/usr/bin/env node

/**
 * Authentication Test Script
 * Tests login functionality with seeded user credentials
 */

const axios = require('axios');
const consoleUtils = require('../utils/consoleUtils');

const BASE_URL = 'http://localhost:5000';

/**
 * Test login with credentials
 */
async function testLogin(email, password, description) {
  try {
    console.log(`\n🔍 Testing ${description}...`);
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.status === 'success') {
      consoleUtils.logSuccess(`✅ ${description}: LOGIN SUCCESSFUL`);
      console.log(`   User: ${response.data.data.user.name} (${response.data.data.user.role})`);
      console.log(`   Email: ${response.data.data.user.email}`);
      return true;
    } else {
      consoleUtils.logError(`❌ ${description}: Unexpected response`);
      return false;
    }

  } catch (error) {
    if (error.response && error.response.status === 401) {
      consoleUtils.logError(`❌ ${description}: INVALID CREDENTIALS (401)`);
    } else {
      consoleUtils.logError(`❌ ${description}: ERROR - ${error.message}`);
    }
    return false;
  }
}

/**
 * Test server health
 */
async function testServerHealth() {
  try {
    console.log('\n🏥 Testing server health...');
    
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.status === 200 && response.data.status === 'success') {
      consoleUtils.logSuccess('✅ Server is healthy and running');
      return true;
    } else {
      consoleUtils.logError('❌ Server health check failed');
      return false;
    }

  } catch (error) {
    consoleUtils.logError(`❌ Server health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n🧪 Authentication Test Suite\n');
  console.log('Testing login functionality with seeded user credentials...\n');

  let passedTests = 0;
  let totalTests = 0;

  // Test server health first
  totalTests++;
  if (await testServerHealth()) {
    passedTests++;
  }

  // Get credentials from environment or use defaults
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@library.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
  const librarianEmail = process.env.LIBRARIAN_EMAIL || 'librarian@library.com';
  const librarianPassword = process.env.LIBRARIAN_PASSWORD || 'Librarian123!';

  // Test valid logins
  totalTests++;
  if (await testLogin(adminEmail, adminPassword, 'Admin Login')) {
    passedTests++;
  }

  totalTests++;
  if (await testLogin(librarianEmail, librarianPassword, 'Librarian Login')) {
    passedTests++;
  }

  // Test invalid logins
  totalTests++;
  const invalidResult1 = await testLogin(adminEmail, 'WrongPassword', 'Admin Invalid Password');
  if (!invalidResult1) { // Should fail
    passedTests++;
    consoleUtils.logSuccess('✅ Admin Invalid Password: CORRECTLY REJECTED');
  }

  totalTests++;
  const invalidResult2 = await testLogin('nonexistent@example.com', 'password', 'Non-existent User');
  if (!invalidResult2) { // Should fail
    passedTests++;
    consoleUtils.logSuccess('✅ Non-existent User: CORRECTLY REJECTED');
  }

  totalTests++;
  const invalidResult3 = await testLogin(librarianEmail, 'wrongpass', 'Librarian Invalid Password');
  if (!invalidResult3) { // Should fail
    passedTests++;
    consoleUtils.logSuccess('✅ Librarian Invalid Password: CORRECTLY REJECTED');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    consoleUtils.logSuccess('\n🎉 ALL TESTS PASSED! Authentication is working correctly.');
    console.log('\n✅ You can now login with the following credentials:');
    console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
    console.log(`   Librarian: ${librarianEmail} / ${librarianPassword}`);
  } else {
    consoleUtils.logError(`\n❌ ${totalTests - passedTests} test(s) failed. Please check the issues above.`);
  }

  console.log('\n');
  return passedTests === totalTests;
}

/**
 * Main execution
 */
async function main() {
  try {
    const success = await runTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    consoleUtils.logError('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  main();
}
