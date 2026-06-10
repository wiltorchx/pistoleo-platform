import mongoose from 'mongoose';
import fs from 'fs';

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

async function checkDbConnection() {
    try {
        const env = await loadEnv();
        await mongoose.connect(env.MONGODB_URI);
        console.log('Successfully connected to MongoDB Atlas!');
    } catch (err) {
        console.error('Failed to connect to MongoDB Atlas:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

checkDbConnection();
