import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_BASE = 'http://localhost:5000/api';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sohamkedar02@gmail.com').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

async function runTests() {
  console.log('====================================================');
  console.log('   KAVERI NURSERY - AUTOMATED END-TO-END TEST SUITE ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('--- 1. Health & Server Status ---');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'GET /api/health returned 200 OK');

    // 2. Authentication
    console.log('\n--- 2. Authentication & Authorization ---');
    
    // Admin login
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.token && adminLoginData.user.role === 'admin', 'Admin login successful with valid JWT and role=admin');
    const adminToken = adminLoginData.token;

    // Invalid password test
    const badLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: 'NonExistentPassword_999#' })
    });
    assert(badLoginRes.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // Auth /me check
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user.email === 'sohamkedar02@gmail.com', 'GET /api/auth/me returns authenticated admin profile');

    // Customer registration
    const testCustomerEmail = `testcust_${Date.now()}@example.com`;
    const custRegRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: 'Password123!',
        displayName: 'Test Customer',
        phone: '9876543210'
      })
    });
    const custRegData = await custRegRes.json();
    assert(custRegRes.status === 201 && custRegData.user.role === 'customer', 'Customer registration creates user with role=customer');
    const customerToken = custRegData.token;

    // Protected admin route with customer token (should fail 403)
    const custAdminAccess = await fetch(`${API_BASE}/reviews/admin`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert(custAdminAccess.status === 403, 'Customer token rejected on admin-only route with 403 Forbidden');

    // 3. Plants Catalog & Image Binary Storage
    console.log('\n--- 3. Plants Inventory & BYTEA Image Storage ---');
    
    // List plants
    const plantsRes = await fetch(`${API_BASE}/plants`);
    const plantsList = await plantsRes.json();
    assert(plantsRes.status === 200 && Array.isArray(plantsList), `GET /api/plants returned ${plantsList.length} plants`);

    // Create a plant with multipart/form-data
    const dummyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const boundary = '----WebKitFormBoundaryTest123';
    
    let plantBody = '';
    plantBody += `--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nTest Golden Pothos\r\n`;
    plantBody += `--${boundary}\r\nContent-Disposition: form-data; name="scientificName"\r\n\r\nEpipremnum aureum\r\n`;
    plantBody += `--${boundary}\r\nContent-Disposition: form-data; name="price"\r\n\r\n299\r\n`;
    plantBody += `--${boundary}\r\nContent-Disposition: form-data; name="stock"\r\n\r\n45\r\n`;
    plantBody += `--${boundary}\r\nContent-Disposition: form-data; name="category"\r\n\r\nIndoor\r\n`;
    plantBody += `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nA hardy trailing vine plant.\r\n`;
    plantBody += `--${boundary}\r\nContent-Disposition: form-data; name="imageFile"; filename="golden_pothos.png"\r\nContent-Type: image/png\r\n\r\n`;
    
    const plantPostPayload = Buffer.concat([
      Buffer.from(plantBody, 'utf-8'),
      dummyImageBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
    ]);

    const createPlantRes = await fetch(`${API_BASE}/plants`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: plantPostPayload
    });
    const createdPlant = await createPlantRes.json();
    assert(createPlantRes.status === 201 && createdPlant.id && createdPlant.name === 'Test Golden Pothos', `Plant created with ID: ${createdPlant.id}`);

    // Stream image from BYTEA endpoint
    const streamImageRes = await fetch(`${API_BASE}/plants/${createdPlant.id}/image`);
    const streamContentType = streamImageRes.headers.get('content-type');
    const imageBytes = await streamImageRes.arrayBuffer();
    assert(streamImageRes.status === 200 && streamContentType.includes('image') && imageBytes.byteLength > 0, `GET /api/plants/:id/image streamed ${imageBytes.byteLength} bytes binary BYTEA`);

    // Update plant
    const updatePlantRes = await fetch(`${API_BASE}/plants/${createdPlant.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Golden Pothos (Updated)',
        price: 349,
        stock: 50,
        category: 'Indoor'
      })
    });
    const updatedPlant = await updatePlantRes.json();
    assert(updatePlantRes.status === 200 && updatedPlant.price === 349, 'Plant updated successfully');

    // Delete test plant
    const deletePlantRes = await fetch(`${API_BASE}/plants/${createdPlant.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(deletePlantRes.status === 200, 'Plant deleted successfully');

    // 4. Projects & Gallery
    console.log('\n--- 4. Landscaping Projects & Multi-Image Gallery ---');
    const projectsRes = await fetch(`${API_BASE}/projects`);
    const projectsList = await projectsRes.json();
    assert(projectsRes.status === 200 && Array.isArray(projectsList), `GET /api/projects returned ${projectsList.length} projects`);

    // 5. Customer Reviews & Approval Flow
    console.log('\n--- 5. Customer Reviews & Admin Approval Flow ---');
    const createReviewRes = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Anita Deshmukh',
        rating: 5,
        text: 'Beautiful healthy plants delivered on time!'
      })
    });
    const newReview = await createReviewRes.json();
    assert(createReviewRes.status === 201 && newReview.approved === false, 'Public review submitted with pending approval status');

    // Admin approves review
    const approveReviewRes = await fetch(`${API_BASE}/reviews/${newReview.id}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const approvedReview = await approveReviewRes.json();
    assert(approveReviewRes.status === 200 && approvedReview.ok === true, 'Admin approved review successfully');

    // Clean up review
    const deleteReviewRes = await fetch(`${API_BASE}/reviews/${newReview.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(deleteReviewRes.status === 200, 'Test review deleted');

    // 6. Bills & Invoices
    console.log('\n--- 6. Bills & Invoices Calculation ---');
    const createBillRes = await fetch(`${API_BASE}/bills`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'Bill',
        customerName: 'Rahul Shinde',
        customerPhone: '9822001122',
        date: '2026-09-24',
        notes: 'Delivery to Farmhouse',
        lines: [
          { plantName: 'Coconut Hybrid Sapling', qty: 10, rate: 250 },
          { plantName: 'Vermicompost (5kg Bag)', qty: 5, rate: 180 }
        ]
      })
    });
    const savedBill = await createBillRes.json();
    const expectedTotal = (10 * 250) + (5 * 180); // 2500 + 900 = 3400
    assert(createBillRes.status === 201 && savedBill.total === expectedTotal && savedBill.lines.length === 2, `Bill created with calculated total Rs. ${savedBill.total} and 2 items`);

    // Clean up test bill
    const deleteBillRes = await fetch(`${API_BASE}/bills/${savedBill.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(deleteBillRes.status === 200, 'Test bill deleted');

    // 7. Labour Register & Ledger
    console.log('\n--- 7. Labour Directory & Ledger Tracking ---');
    const createLabourRes = await fetch(`${API_BASE}/labours`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Ramesh Patil',
        role: 'Gardener',
        daily_wage: 450,
        phone: '9890112233'
      })
    });
    const newLabour = await createLabourRes.json();
    assert(createLabourRes.status === 201 && newLabour.salaryRate === 450, `Labour created: ${newLabour.name} (Wage: Rs. ${newLabour.salaryRate})`);

    // Record attendance
    const attendanceRes = await fetch(`${API_BASE}/attendance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        labour_id: newLabour.id,
        date: '2026-09-24',
        status: 'Present'
      })
    });
    const savedAttendance = await attendanceRes.json();
    assert(attendanceRes.status === 200 && savedAttendance.ok === true, 'Attendance logged successfully');

    // Record advance
    const advanceRes = await fetch(`${API_BASE}/advances`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        labour_id: newLabour.id,
        amount: 500,
        date: '2026-09-24',
        notes: 'Festival advance'
      })
    });
    const savedAdvance = await advanceRes.json();
    assert(advanceRes.status === 201 && savedAdvance.amount === 500, 'Advance payment logged');

    // Clean up test labour
    const deleteLabourRes = await fetch(`${API_BASE}/labours/${newLabour.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(deleteLabourRes.status === 200, 'Test labour worker deleted (cascade verified)');

    // 8. Site Stats & App Settings
    console.log('\n--- 8. Site Statistics & App Settings ---');
    const visitRes = await fetch(`${API_BASE}/stats/visitors/increment`, { method: 'POST' });
    const visitData = await visitRes.json();
    assert(visitRes.status === 200 && visitData.count > 0, `Site visitors incremented: ${visitData.count} total visits`);

    const statsRes = await fetch(`${API_BASE}/stats/visitors`);
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.count !== undefined, `Site stats fetched: ${statsData.count} visits`);

    // Billing settings
    const settingsRes = await fetch(`${API_BASE}/settings/billing`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ letterheadType: 'digital' })
    });
    const settingsData = await settingsRes.json();
    assert(settingsRes.status === 200 && settingsData.letterheadType === 'digital', 'App billing settings updated');

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Test execution exception:', err);
  } finally {
    await pool.end();
  }
}

runTests();
