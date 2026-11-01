const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['CLIENT', 'FREELANCER', 'ADMIN'],
      default: 'CLIENT'
    },
    // Brute-force protection (account lockout). Counts consecutive failed
    // logins; when it reaches the configured limit, lockUntil is set and
    // logins are refused until that time passes. Both are reset by a
    // successful login. Never exposed to the client (see toSafeObject).
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

/**
 * True while the account is temporarily locked after too many failed
 * logins. An expired lock counts as unlocked.
 */
userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

/**
 * Find a user by email, normalising the same way registration/login do.
 */
userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

/**
 * Find a user by id, safely. Mongoose's built-in findById throws a
 * CastError for a string that isn't a valid ObjectId (e.g. a token
 * left over from before this migration, or a tampered value). We
 * treat "not a valid id" the same as "not found" rather than letting
 * that turn into an unexpected 500 error.
 */
userSchema.statics.findByIdSafe = function findByIdSafe(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Promise.resolve(null);
  }
  return this.findOne({ _id: id });
};

/**
 * Returns every user. Used by the admin "list users" endpoint.
 */
userSchema.statics.findAllUsers = function findAllUsers() {
  return this.find({});
};

/**
 * Deletes every user. Used only by the automated test suite to reset
 * state between tests.
 */
userSchema.statics.deleteAllUsers = function deleteAllUsers() {
  return this.deleteMany({});
};

/**
 * Returns a plain object safe to send to the client: never includes
 * passwordHash, and exposes only the fields the frontend needs.
 */
userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', userSchema);