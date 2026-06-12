import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { parseInventoryPdf } from './lib/pistoleo/pdfParser';

async function testFullFlow() {
  console.log('=== TEST FULL INVENTORY FLOW ===\n');
  
  // 1. Parse PDF
  console.log('1. Parsing PDF...');
  const buffer = fs.readFileSync('C:\\Users\\Comunicaciones\\Desktop\\Reporte de Inventario-20260610-103507.pdf');
  const items = await parseInventoryPdf(buffer);
  console.log(`   Parsed ${items.length} items`);
  console.log(`   Sample:`, items.slice(0, 3));
  console.log(`   Total quantity:`, items.reduce((acc, i) => acc + i.quantity, 0));
  console.log(`   Zero quantities:`, items.filter(i => i.quantity === 0).length);
  
  // 2. Test create-batch API (simulating authenticated user)
  console.log('\n2. Testing create-batch API...');
  
  // First, get a valid user by logging in
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lms.com', password: 'Test1234' })
  });
  
  if (!loginRes.ok) {
    console.log('   Login failed, trying to seed first...');
    return;
  }
  
  const loginData = await loginRes.json();
  console.log(`   Logged in as: ${loginData.user.email} (${loginData.user.id})`);
  const userId = loginData.user.id;
  
  // Get cookie for subsequent requests
  const cookie = loginRes.headers.get('set-cookie');
  
  // Create batch
  const batchRes = await fetch('http://localhost:3000/api/pistoleo', {
    method: 'POST',
    headers: cookie ? { 'Cookie': cookie } : {},
    body: (() => {
      const fd = new FormData();
      fd.append('action', 'create-batch');
      fd.append('name', 'Test Inventory Batch');
      fd.append('userId', userId);
      return fd;
    })()
  });
  
  const batchData = await batchRes.json();
  console.log(`   Batch created:`, batchData);
  
  if (batchData._id) {
    // 3. Test commit-inventory API
    console.log('\n3. Testing commit-inventory API...');
    const commitRes = await fetch('http://localhost:3000/api/pistoleo', {
      method: 'POST',
      headers: cookie ? { 'Cookie': cookie } : {},
      body: (() => {
        const fd = new FormData();
        fd.append('action', 'commit-inventory');
        fd.append('batchId', batchData._id);
        fd.append('items', JSON.stringify(items));
        return fd;
      })()
    });
    
    const commitData = await commitRes.json();
    console.log(`   Commit result:`, commitData);
    
    // 4. Verify data via GET API
    console.log('\n4. Verifying via GET /api/pistoleo/[id]...');
    const getRes = await fetch(`http://localhost:3000/api/pistoleo/${batchData._id}`, {
      headers: cookie ? { 'Cookie': cookie } : {}
    });
    const getData = await getRes.json();
    console.log(`   Items returned: ${getData.items?.length || 0}`);
    console.log(`   Summary: total=${getData.totalItems}, complete=${getData.complete}, missing=${getData.missing}`);
    if (getData.items && getData.items.length > 0) {
      console.log(`   Sample:`, getData.items[0]);
    }
  }
}

testFullFlow().catch(console.error);