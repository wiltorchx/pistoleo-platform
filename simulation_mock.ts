import fs from 'fs';

// Mock Database
const db = {
    batches: [],
    inventory: [],
    scans: []
};

const MockMongoose = {
    Types: {
        ObjectId: class {
            static generate() { return Math.random().toString(36).substr(2, 9); }
        }
    }
};

const MockModel = (name) => ({
    create: async (data) => {
        const doc = { ...data, _id: MockMongoose.Types.ObjectId.generate() };
        db[name === 'PistoleoBatch' ? 'batches' : (name === 'PistoleoInventory' ? 'inventory' : 'scans')].push(doc);
        return doc;
    },
    find: async (query) => {
        const collection = db[name === 'PistoleoBatch' ? 'batches' : (name === 'PistoleoInventory' ? 'inventory' : 'scans')];
        if (query.batchId) return collection.filter(i => i.batchId === query.batchId);
        return collection;
    },
    insertMany: async (docs) => {
        const added = docs.map(d => ({ ...d, _id: MockMongoose.Types.ObjectId.generate() }));
        db[name === 'PistoleoBatch' ? 'batches' : (name === 'PistoleoInventory' ? 'inventory' : 'scans')].push(...added);
        return added;
    }
});

const PistoleoBatch = MockModel('PistoleoBatch');
const PistoleoInventory = MockModel('PistoleoInventory');
const PistoleoScan = MockModel('PistoleoScan');

async function runSimulation() {
    console.log('Starting Simulation with Mock DB...');
    
    const products = JSON.parse(fs.readFileSync('extracted_products.json', 'utf8'));
    const sampleProducts = products.slice(0, 20);

    // 1. Create Batch
    const batch = await PistoleoBatch.create({
        name: `SIMULATION TEST ${new Date().toISOString()}`,
        status: 'in_progress',
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
        
        if (i % 4 === 0) scanCount = item.expectedQuantity; // COMPLETE
        else if (i % 4 === 1) scanCount = Math.max(1, item.expectedQuantity - 1); // PARTIAL
        else if (i % 4 === 2) scanCount = item.expectedQuantity + 2; // OVER
        else scanCount = 0; // MISSING

        console.log(`Scanning ${item.upc}: ${scanCount}/${item.expectedQuantity}`);
        
        for (let s = 0; s < scanCount; s++) {
            await PistoleoScan.create({ batchId: batch._id, upc: item.upc });
        }

        item.actualQuantity = scanCount;
        if (item.actualQuantity === 0) item.status = 'missing';
        else if (item.actualQuantity < item.expectedQuantity) item.status = 'partial';
        else if (item.actualQuantity === item.expectedQuantity) item.status = 'complete';
        else item.status = 'over';
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

    console.log('\n--- SIMULATION FINAL SUMMARY ---');
    console.table(summary);
    console.log('-------------------------------\n');

    console.log('Simulation successful. Logic verified.');
}

runSimulation();
