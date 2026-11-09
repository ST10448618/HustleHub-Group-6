// backend/tests/setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

async function clearTestDB() {
  const { collections } = mongoose.connection;
  const promises = Object.values(collections).map((collection) =>
    collection.deleteMany({})
  );
  await Promise.all(promises);
}

/**
 * Closes the Mongoose connection and stops the in-memory MongoDB
 * instance. Call this once in afterAll().
 */
async function closeTestDB() {
  // readyState 0 means "never connected" - guard against trying to
  // close/drop a connection that was never actually established.
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

module.exports = { connectTestDB, clearTestDB, closeTestDB };