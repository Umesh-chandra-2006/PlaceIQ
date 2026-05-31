const axios = require('axios');
const url = require('url');

const API_BASE = 'http://localhost:5001/api';

async function runTests() {
  console.log('=== STARTING HIERARCHICAL PROVISIONING API VERIFICATION ===');
  
  try {
    // 1. Log in as Super Admin
    console.log('\n[Step 1] Logging in as Super Admin...');
    const superAdminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'change_this_password123'
    });
    const superAdminToken = superAdminLogin.data.token;
    console.log('✓ Super Admin logged in successfully.');

    // 2. Provision College & College Admin
    console.log('\n[Step 2] Provisioning College "Anurag University" and its admin...');
    const collegeRes = await axios.post(
      `${API_BASE}/admin/colleges`,
      {
        name: 'Anurag University',
        emailDomain: 'anurag.edu.in',
        licenceStatus: 'paid',
        adminName: 'College Admin User',
        adminEmail: 'collegeadmin@anurag.edu.in'
      },
      { headers: { Authorization: `Bearer ${superAdminToken}` } }
    );
    
    const { setupLink } = collegeRes.data;
    console.log('✓ College and Admin provisioned.');
    console.log(`  Setup Link: ${setupLink}`);

    // Parse email and token from setupLink
    const parsedUrl = url.parse(setupLink, true);
    const collegeAdminEmail = parsedUrl.query.email;
    const collegeAdminToken = parsedUrl.query.token;

    // 3. Verify setup token
    console.log('\n[Step 3] Verifying College Admin setup token...');
    const verifyAdminRes = await axios.get(
      `${API_BASE}/auth/setup-verify?email=${encodeURIComponent(collegeAdminEmail)}&token=${collegeAdminToken}`
    );
    console.log(`✓ Setup token verified. User role: ${verifyAdminRes.data.role}, Name: ${verifyAdminRes.data.name}`);

    // 4. Complete setup for College Admin
    console.log('\n[Step 4] Completing setup for College Admin (setting password)...');
    const completeAdminRes = await axios.post(`${API_BASE}/auth/setup-complete`, {
      email: collegeAdminEmail,
      token: collegeAdminToken,
      password: 'collegeadmin123'
    });
    const collegeAdminJwt = completeAdminRes.data.token;
    console.log('✓ College Admin setup complete. Obtained JWT.');

    // 5. Provision Coordinator
    console.log('\n[Step 5] Provisioning a Coordinator as College Admin...');
    const coordinatorRes = await axios.post(
      `${API_BASE}/admin/coordinators`,
      {
        name: 'Coordinator Admin User',
        email: 'coordinator@anurag.edu.in'
      },
      { headers: { Authorization: `Bearer ${collegeAdminJwt}` } }
    );
    
    const coordSetupLink = coordinatorRes.data.setupLink;
    console.log('✓ Coordinator provisioned.');
    console.log(`  Coordinator Setup Link: ${coordSetupLink}`);

    const parsedCoordUrl = url.parse(coordSetupLink, true);
    const coordEmail = parsedCoordUrl.query.email;
    const coordToken = parsedCoordUrl.query.token;

    // 6. Complete setup for Coordinator
    console.log('\n[Step 6] Completing setup for Coordinator (setting password)...');
    const completeCoordRes = await axios.post(`${API_BASE}/auth/setup-complete`, {
      email: coordEmail,
      token: coordToken,
      password: 'coordinator123'
    });
    const coordJwt = completeCoordRes.data.token;
    console.log('✓ Coordinator setup complete. Obtained JWT.');

    // 7. Create a Cohort (Batch) as Coordinator
    console.log('\n[Step 7] Creating a Cohort/Batch as Coordinator...');
    const batchRes = await axios.post(
      `${API_BASE}/batches`,
      {
        name: 'CSE 2025',
        branch: 'CSE',
        section: 'A',
        year: 2025
      },
      { headers: { Authorization: `Bearer ${coordJwt}` } }
    );
    const batchId = batchRes.data._id;
    console.log(`✓ Cohort created successfully (ID: ${batchId}).`);

    // 8. Provision Student individually under the batch
    console.log('\n[Step 8] Provisioning a student individually under the Cohort...');
    const studentRes = await axios.post(
      `${API_BASE}/batches/${batchId}/students/single`,
      {
        name: 'Student One',
        email: 'student1@anurag.edu.in',
        rollNumber: '21EG105101',
        branch: 'CSE',
        year: 2025,
        cgpa: 8.5
      },
      { headers: { Authorization: `Bearer ${coordJwt}` } }
    );
    console.log(`✓ Student provisioned. Name: ${studentRes.data.name}, Email: ${studentRes.data.email}`);

    // 9. Login as Student using default password
    console.log('\n[Step 9] Logging in as Student using default password ("student123")...');
    const studentLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'student1@anurag.edu.in',
      password: 'student123'
    });
    console.log('✓ Student logged in successfully.');
    console.log(`  Token: ${studentLogin.data.token.substring(0, 20)}...`);

    console.log('\n=== ALL HIERARCHICAL PROVISIONING TESTS PASSED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\n❌ Test execution failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTests();
