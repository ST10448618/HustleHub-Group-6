const mongoose = require('mongoose');

const revokedTokenSchema = new mongoose.Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: String
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('RevokedToken', revokedTokenSchema);