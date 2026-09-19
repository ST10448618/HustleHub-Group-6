// backend/tests/setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Starts a private, in-memory MongoDB instance and connects Mongoose
 * to it. Each test FILE that needs the database calls this once in
 * its own beforeAll(). This means tests:
 *  - never touch the real MongoDB Atlas database
 *  - never need network access or an internet connection to run
 *  - start with a completely empty, isolated database every run
 */
async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

/**
 * Deletes all documents from every collection. Call this in
 * afterEach() so each test starts with a clean database, without
 * paying the cost of tearing down and restarting MongoMemoryServer
 * between every single test.
 */
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