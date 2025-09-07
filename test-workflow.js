const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const CUSTOMER_TOKEN = 'your-customer-jwt-token';
const ADMIN_TOKEN = 'your-admin-jwt-token';
const SHIPPER_TOKEN = 'your-shipper-jwt-token';

// Test data
const testData = {
  customer: {
    email: 'customer@test.com',
    password: 'password123',
    full_name: 'Test Customer',
    role: 'customer'
  },
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    full_name: 'Test Admin',
    role: 'admin'
  },
  shipper: {
    email: 'shipper@test.com',
    password: 'password123',
    full_name: 'Test Shipper',
    role: 'shipper'
  }
};

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test the complete workflow
const testCompleteWorkflow = async () => {
  console.log('🚀 Starting DevPort Workflow Test\n');

  let customerToken, adminToken, shipperToken;
  let shipmentRequestId, quotationId, shipmentId;

  try {
    // Step 1: Register and login users
    console.log('1️⃣ Registering and logging in users...');
    
    // Register customer
    const customerReg = await makeRequest('POST', '/auth/register', testData.customer);
    if (customerReg.success) {
      console.log('✅ Customer registered');
      customerToken = customerReg.data.user?.id; // Use user ID as token for testing
    }

    // Register admin
    const adminReg = await makeRequest('POST', '/auth/register', testData.admin);
    if (adminReg.success) {
      console.log('✅ Admin registered');
      adminToken = adminReg.data.user?.id;
    }

    // Register shipper
    const shipperReg = await makeRequest('POST', '/auth/register', testData.shipper);
    if (shipperReg.success) {
      console.log('✅ Shipper registered');
      shipperToken = shipperReg.data.user?.id;
    }

    // Step 2: Create profiles
    console.log('\n2️⃣ Creating user profiles...');
    
    // Create customer profile
    const customerProfile = await makeRequest('POST', '/profiles', {
      full_name: testData.customer.full_name,
      role: 'customer'
    }, customerToken);
    
    if (customerProfile.success) {
      console.log('✅ Customer profile created');
    }

    // Create admin profile
    const adminProfile = await makeRequest('POST', '/profiles', {
      full_name: testData.admin.full_name,
      role: 'admin'
    }, adminToken);
    
    if (adminProfile.success) {
      console.log('✅ Admin profile created');
    }

    // Create shipper profile
    const shipperProfile = await makeRequest('POST', '/profiles', {
      full_name: testData.shipper.full_name,
      role: 'shipper'
    }, shipperToken);
    
    if (shipperProfile.success) {
      console.log('✅ Shipper profile created');
    }

    // Step 3: Create customer profile
    console.log('\n3️⃣ Creating customer company profile...');
    
    const customerCompany = await makeRequest('POST', '/customers', {
      company_name: 'Test Customer Corp',
      contact_name: 'John Customer',
      contact_email: 'john@testcustomer.com',
      contact_phone: '+1234567890',
      address_line1: '123 Customer St',
      city: 'New York',
      state: 'NY',
      country: 'USA'
    }, customerToken);
    
    if (customerCompany.success) {
      console.log('✅ Customer company profile created');
    }

    // Step 4: Create shipper profile
    console.log('\n4️⃣ Creating shipper company profile...');
    
    const shipperCompany = await makeRequest('POST', '/shippers', {
      company_name: 'Test Shipper Corp',
      contact_name: 'Jane Shipper',
      contact_email: 'jane@testshipper.com',
      contact_phone: '+1234567891',
      address_line1: '456 Shipper Ave',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      license_number: 'SHIP123456'
    }, shipperToken);
    
    if (shipperCompany.success) {
      console.log('✅ Shipper company profile created');
    }

    // Step 5: Customer creates shipment request
    console.log('\n5️⃣ Customer creates shipment request...');
    
    const shipmentRequest = await makeRequest('POST', '/shipments/requests', {
      origin: 'New York, NY',
      destination: 'Los Angeles, CA',
      preferred_mode: 'truck',
      cargo_type: 'Electronics',
      container_type: 'standard',
      weight: 1000,
      volume: 50,
      notes: 'Fragile electronics shipment'
    }, customerToken);
    
    if (shipmentRequest.success) {
      shipmentRequestId = shipmentRequest.data.id;
      console.log('✅ Shipment request created:', shipmentRequest.data.id);
      console.log('   Status:', shipmentRequest.data.status);
    } else {
      console.log('❌ Failed to create shipment request:', shipmentRequest.error);
      return;
    }

    // Step 6: Admin sends request to shippers
    console.log('\n6️⃣ Admin sends request to shippers...');
    
    const sendToShippers = await makeRequest('PATCH', `/shipments/requests/${shipmentRequestId}/send-to-shippers`, {
      admin_notes: 'High priority shipment, please provide competitive quotes'
    }, adminToken);
    
    if (sendToShippers.success) {
      console.log('✅ Request sent to shippers');
      console.log('   Status:', sendToShippers.data.shipmentRequest.status);
    } else {
      console.log('❌ Failed to send to shippers:', sendToShippers.error);
      return;
    }

    // Step 7: Shipper creates quotation
    console.log('\n7️⃣ Shipper creates quotation...');
    
    const quotation = await makeRequest('POST', '/quotations', {
      shipment_request_id: shipmentRequestId,
      price: 5000,
      currency: 'USD',
      estimated_delivery_days: 7,
      valid_until: '2024-02-15',
      additional_terms: 'Insurance included, tracking provided'
    }, shipperToken);
    
    if (quotation.success) {
      quotationId = quotation.data.id;
      console.log('✅ Quotation created:', quotation.data.id);
      console.log('   Price: $', quotation.data.price);
      console.log('   Delivery: ', quotation.data.estimated_delivery_days, 'days');
    } else {
      console.log('❌ Failed to create quotation:', quotation.error);
      return;
    }

    // Step 8: Admin selects quotation
    console.log('\n8️⃣ Admin selects quotation...');
    
    const selectQuotation = await makeRequest('PATCH', `/shipments/requests/${shipmentRequestId}/select-quotation`, {
      quotation_id: quotationId,
      admin_selection_notes: 'Best price and delivery time combination'
    }, adminToken);
    
    if (selectQuotation.success) {
      console.log('✅ Quotation selected by admin');
      console.log('   Status:', selectQuotation.data.shipmentRequest.status);
    } else {
      console.log('❌ Failed to select quotation:', selectQuotation.error);
      return;
    }

    // Step 9: Customer approves quotation
    console.log('\n9️⃣ Customer approves quotation...');
    
    const approveQuotation = await makeRequest('PATCH', `/shipments/requests/${shipmentRequestId}/approve-quotation`, {
      customer_approval_notes: 'Approved, please proceed with shipment'
    }, customerToken);
    
    if (approveQuotation.success) {
      console.log('✅ Quotation approved by customer');
      console.log('   Status:', approveQuotation.data.shipmentRequest.status);
    } else {
      console.log('❌ Failed to approve quotation:', approveQuotation.error);
      return;
    }

    // Step 10: Admin creates shipment
    console.log('\n🔟 Admin creates shipment...');
    
    const shipment = await makeRequest('POST', '/shipments', {
      quotation_id: quotationId,
      tracking_number: 'TRK' + Date.now(),
      notes: 'Shipment created after customer approval'
    }, adminToken);
    
    if (shipment.success) {
      shipmentId = shipment.data.id;
      console.log('✅ Shipment created:', shipment.data.id);
      console.log('   Tracking:', shipment.data.tracking_number);
      console.log('   Status:', shipment.data.status);
    } else {
      console.log('❌ Failed to create shipment:', shipment.error);
      return;
    }

    // Step 11: Verify final statuses
    console.log('\n1️⃣1️⃣ Verifying final statuses...');
    
    const finalRequest = await makeRequest('GET', `/shipments/requests/${shipmentRequestId}`, null, adminToken);
    const finalQuotation = await makeRequest('GET', `/quotations/${quotationId}`, null, adminToken);
    const finalShipment = await makeRequest('GET', `/shipments/${shipmentId}`, null, adminToken);
    
    console.log('📊 Final Status Summary:');
    console.log('   Shipment Request:', finalRequest.data?.status || 'Unknown');
    console.log('   Quotation:', finalQuotation.data?.status || 'Unknown');
    console.log('   Shipment:', finalShipment.data?.status || 'Unknown');

    console.log('\n🎉 Workflow test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Customer created shipment request');
    console.log('   ✅ Admin sent request to shippers');
    console.log('   ✅ Shipper submitted quotation');
    console.log('   ✅ Admin selected quotation');
    console.log('   ✅ Customer approved quotation');
    console.log('   ✅ Admin created shipment');
    console.log('   ✅ Order management can now begin');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
};

// Run the test
if (require.main === module) {
  testCompleteWorkflow();
}

module.exports = { testCompleteWorkflow };


