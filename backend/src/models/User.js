const mongoose = require('mongoose');

/**
 * User schema
 *
 * Replaces the temporary in-memory User storage used in Part 1 with a
 * real, persistent MongoDB collection via Mongoose.
 *
 * Mongoose automatically provides:
 *  - _id            (the real primary key, an ObjectId)
 *  - id             (a virtual getter that returns _id as a string -
 *                    this is why user.id continues to work unchanged
 *                    everywhere in the codebase after this migration)
 *  - createdAt/updatedAt (via the timestamps option below)
 */
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
    }
  },
  {
    timestamps: true
  }
);

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