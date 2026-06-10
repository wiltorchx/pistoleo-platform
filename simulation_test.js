const mongoose = require('mongoose');
const fs = require('fs');

// Load .env.local manually
const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key] = value.trim();
});

const { PistoleoBatch, PistoleoInventory, PistoleoScan } = require('./models'); // This won't work directly as they are exported from models/ files

// Since models are separate files, I'll import them individually
const PistoleoBatchModel = require('./models/PistoleoBatch');
const PistoleoInventoryModel = require('./models/PistoleoInventory');
const PistoleoScanModel = require('./models/PistoleoScan');

async function runSimulation() {
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const products = JSON.parse(fs.readFileSync('extracted_products.json', 'utf8'));
        const sampleProducts = products.slice(0, 20);

        // 1. Create Batch
        const batch = await PistoleoBatchModel.create({
            name: `SIMULATION TEST ${new Date().toISOString()}`,
            status: 'in_progress',
            createdAt: new Date()
        });
        console.log(`Created Batch: ${batch._id}`);

        // 2. Populate Inventory
        console.log('Populating inventory...');
        const inventoryItems = [];
        for (let i = 0; i < sampleProducts.length; i++) {
            const product = sampleProducts[i];
            const expected = Math.floor(Math.random() * 5) + 1;
            inventoryItems.push({
                batchId: batch._id,
                upc: product.upc,
                description: product.description,
                expectedQuantity: expected,
                actualQuantity: 0,
                status: 'missing'
            });
        }
        await PistoleoInventoryModel.insertMany(inventoryItems);

        // 3. Simulate Scans
        console.log('Simulating scans...');
        const items = await PistoleoInventoryModel.find({ batchId: batch._id });
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let scanCount = 0;
            
            if (i % 4 === 0) { // CASE: COMPLETE
                scanCount = item.expectedQuantity;
            } else if (i % 4 === 1) { // CASE: PARTIAL
                scanCount = Math.max(1, item.expectedQuantity - 1);
            } else if (i % 4 === 2) { // CASE: OVER
                scanCount = item.expectedQuantity + 2;
            } else { // CASE: MISSING
                scanCount = 0;
            }

            console.log(`Simulating ${scanCount} scans for ${item.upc} (Expected: ${item.expectedQuantity})`);
            
            for (let s = 0; s < scanCount; s++) {
                await PistoleoScanModel.create({
                    batchId: batch._id,
                    upc: item.upc,
                    userId: 'admin-id',
                    scannedAt: new Date()
                });
            }

            // Update inventory status (mimicking the API logic)
            item.actualQuantity = scanCount;
            if (item.actualQuantity === 0) item.status = 'missing';
            else if (item.actualQuantity < item.expectedQuantity) item.status = 'partial';
            else if (item.actualQuantity === item.expectedQuantity) item.status = 'complete';
            else item.status = 'over';
            await item.save();
        }

        // 4. Validate Summary
        const finalItems = await PistoleoInventoryModel.find({ batchId: batch._id });
        const summary = {
            totalItems: finalItems.length,
            complete: finalItems.filter(it => it.status === 'complete').length,
            partial: finalItems.filter(it => it.status === 'partial').length,
            missing: finalItems.filter(it => it.status === 'missing').length,
            over: finalItems.filter(it => it.status === 'over').length,
        };

        console.log('\n--- FINAL SUMMARY ---');
        console.log(summary);
        console.log('---------------------\n');

        // 5. Close Batch
        batch.status = 'completed';
        await batch.save();
        console.log('Batch marked as completed.');

    } catch (err) {
        console.error('Simulation Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

runSimulation();
