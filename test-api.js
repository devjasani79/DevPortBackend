// Simple API test script for DevPort Backend
// Run this after starting the server to test the endpoints

const fetch = require('node-fetch');
const BASE_URL = 'http://localhost:5000/api';

// Test functions
async function testHealthCheck() {
  try {
    const response = await fetch(`${BASE_URL.replace('/api', '')}/`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }
}

async function testAuthEndpoints() {
  console.log('\n🔐 Testing Auth Endpoints...');
  
  // Test registration
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        full_name: 'Test User',
        role: 'customer'
      })
    });
    const data = await response.json();
    console.log('✅ Registration:', response.status, data.message || data.error);
  } catch (error) {
    console.log('❌ Registration Failed:', error.message);
  }
}

async function testProtectedEndpoints() {
  console.log('\n🔒 Testing Protected Endpoints...');
  
  try {
    const response = await fetch(`${BASE_URL}/profiles`, {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    const data = await response.json();
    console.log('✅ Protected Endpoint (Unauthorized):', response.status, data.error);
  } catch (error) {
    console.log('❌ Protected Endpoint Test Failed:', error.message);
  }
}

async function testCustomerEndpoints() {
  console.log('\n👥 Testing Customer Endpoints...');
  
  try {
    const response = await fetch(`${BASE_URL}/customers`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    const data = await response.json();
    console.log('✅ Customer Endpoint (Unauthorized):', response.status, data.error);
  } catch (error) {
    console.log('❌ Customer Endpoint Test Failed:', error.message);
  }
}

async function testShipperEndpoints() {
  console.log('\n🚛 Testing Shipper Endpoints...');
  
  try {
    const response = await fetch(`${BASE_URL}/shippers`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    const data = await response.json();
    console.log('✅ Shipper Endpoint (Unauthorized):', response.status, data.error);
  } catch (error) {
    console.log('❌ Shipper Endpoint Test Failed:', error.message);
  }
}

async function testShipmentEndpoints() {
  console.log('\n📦 Testing Shipment Endpoints...');
  
  try {
    const response = await fetch(`${BASE_URL}/shipments/requests`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    const data = await response.json();
    console.log('✅ Shipment Request Endpoint (Unauthorized):', response.status, data.error);
  } catch (error) {
    console.log('❌ Shipment Endpoint Test Failed:', error.message);
  }
}

async function testQuotationEndpoints() {
  console.log('\n💰 Testing Quotation Endpoints...');
  
  try {
    const response = await fetch(`${BASE_URL}/quotations`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    const data = await response.json();
    console.log('✅ Quotation Endpoint (Unauthorized):', response.status, data.error);
  } catch (error) {
    console.log('❌ Quotation Endpoint Test Failed:', error.message);
  }
}

async function testAdminEndpoints() {
  console.log('\n👨‍💼 Testing Admin Endpoints...');
  
  try {
    const response = await fetch(`${BASE_URL}/admin/users`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    const data = await response.json();
    console.log('✅ Admin Endpoint (Unauthorized):', response.status, data.error);
  } catch (error) {
    console.log('❌ Admin Endpoint Test Failed:', error.message);
  }
}

async function testSuperadminEndpoints() {
  console.log('\n👑 Testing Superadmin Endpoints...');
  
  try {
    const response = await fetch(`${BASE_URL}/superadmin/users`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    const data = await response.json();
    console.log('✅ Superadmin Endpoint (Unauthorized):', response.status, data.error);
  } catch (error) {
    console.log('❌ Superadmin Endpoint Test Failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting DevPort Backend API Tests...\n');
  
  await testHealthCheck();
  await testAuthEndpoints();
  await testProtectedEndpoints();
  await testCustomerEndpoints();
  await testShipperEndpoints();
  await testShipmentEndpoints();
  await testQuotationEndpoints();
  await testAdminEndpoints();
  await testSuperadminEndpoints();
  
  console.log('\n✨ All tests completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Set up your .env file with Supabase credentials');
  console.log('2. Run the database schema: database/schema.sql');
  console.log('3. Test with real authentication tokens');
  console.log('4. Use the frontend to interact with the API');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testAuthEndpoints,
  testProtectedEndpoints
}; 