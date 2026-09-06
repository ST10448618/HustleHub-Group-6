// backend/tests/setup.js
const User = require('../src/models/User');

// Clear users before each test
beforeEach(() => {
    User.deleteAll();
});

// Global teardown
afterAll(() => {
    // Clean up if needed
});