const { MongoClient, ObjectId } = require('mongodb');

process.env.MONGODB_URI = 'mongodb+srv://dbuser0h9guq:kami5132!@docdb-cluster-20260925-0745.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000'; //password, I don't have the access

if (!process.env.MONGODB_URI) {
    // throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    process.env.MONGODB_URI = 'mongodb://localhost:3000';
}

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

async function connectToDB() {
    const connectedClient = await clientPromise;
    return connectedClient.db('bookingsDB');
}

async function shutdown() {
    try {
        await clientPromise;
        await client.close();
    } finally {
        process.exit(0);
    }
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

module.exports = { connectToDB, ObjectId };