const config = require('../config');

/**
 * Temporary in-memory User model for Part 1
 * Will be replaced by Mongoose schema in Part 2
 */
class User {
  constructor({ name, email, passwordHash, role = 'CLIENT' }) {
    this.id = config.tempStorage.nextId++;
    this.name = name;
    this.email = email.toLowerCase().trim();
    this.passwordHash = passwordHash;
    this.role = role;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static create(userData) {
    const user = new User(userData);
    config.tempStorage.users.push(user);
    return user;
  }

  static findByEmail(email) {
    return config.tempStorage.users.find(
      u => u.email === email.toLowerCase().trim()
    );
  }

  static findById(id) {
    return config.tempStorage.users.find(u => u.id === id);
  }

  static findAll() {
    return [...config.tempStorage.users];
  }

  static deleteAll() {
    config.tempStorage.users = [];
    config.tempStorage.nextId = 1;
  }

  toSafeObject() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;