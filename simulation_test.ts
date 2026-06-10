import mongoose from 'mongoose';
import fs from 'fs';
import { PistoleoBatch } from './models/PistoleoBatch';
import { PistoleoInventory } from './models/PistoleoInventory';
import { PistoleoScan } from './models/PistoleoScan';

async function loadEnv() {
    const env: Record<string, string> = {};
    const content = fs.readFileSync('.env.local', 'utf8');
    content.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return;
        const firstEqualsIndex = trimmedLine.indexOf('=');
        if (firstEqualsIndex !== -1) {
            const key = trimmedLine.substring(0, firstEqualsIndex);
            const value = trimmedLine.substring(firstEqualsIndex + 1);
            env[key] = value.trim();
        }
    });
    return env;
}

async function runSimulation() {
    try {
        const env = await loadEnv();
        await mongoose.connect(env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const products = JSON.parse(fs.readFileSync('extracted_products.json', 'utf8'));
        const sampleProducts = products.slice(0, 20);

        // 1. Create Batch
        const batch = await PistoleoBatch.create({
            name: `SIMULATION TEST ${new Date().toISOString()}`,
            status: 'in_progress',
            createdBy: new mongoose.Types.ObjectId(), // Random User ID
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
        await PistoleoInventory.insertMany(inventoryItems);

        // 3. Simulate Scans
        console.log('Simulating scans...');
        const items = await PistoleoInventory.find({ batchId: batch._id });
        
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
                await PistoleoScan.create({
                    batchId: batch._id,
                    upc: item.upc,
                    userId: new mongoose.Types.ObjectId(),
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
        const finalItems = await PistoleoInventory.find({ batchId: batch._id });
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
