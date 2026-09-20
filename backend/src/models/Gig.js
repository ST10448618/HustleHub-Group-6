const mongoose = require('mongoose');

// Kept as a single source of truth: gigValidation.js references
// Gig.CATEGORIES directly instead of duplicating this list.
const GIG_CATEGORIES = [
  'Software',
  'Design',
  'Photography',
  'Writing',
  'Marketing',
  'Video',
  'Business',
  'Other'
];

const GIG_STATUSES = ['ACTIVE', 'INACTIVE'];

const gigSchema = new mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title is too long']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description is too long']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: GIG_CATEGORIES,
        message: `Category must be one of: ${GIG_CATEGORIES.join(', ')}`
      }
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than 0']
    },
    depositAmount: {
      type: Number,
      required: [true, 'Deposit amount is required'],
      min: [0, 'Deposit amount cannot be negative']
    },
    status: {
      type: String,
      enum: GIG_STATUSES,
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

/**
 * The "deposit cannot exceed price" rule is enforced here, at the
 * schema level, rather than only in request validation. This matters
 * because an update might change only price or only depositAmount -
 * this hook runs against the fully-merged document on every save(),
 * so it correctly catches an update that would create an invalid
 * combination even when only one of the two fields was sent.
 */
gigSchema.pre('validate', function enforceDepositNotAbovePrice(next) {
  if (this.depositAmount > this.price) {
    this.invalidate('depositAmount', 'Deposit amount cannot be greater than the price');
  }
  next();
});

/**
 * Returns a plain object safe to send to the client. If freelancerId
 * has been populated (see gigService.js), a small public "freelancer"
 * object (id + name only - never email) is included for the frontend
 * to display on marketplace cards and gig detail pages.
 */
gigSchema.methods.toSafeObject = function toSafeObject() {
  const isPopulated = this.freelancerId && this.freelancerId.name !== undefined;

  const obj = {
    id: this.id,
    freelancerId: isPopulated
      ? this.freelancerId._id.toString()
      : this.freelancerId.toString(),
    title: this.title,
    description: this.description,
    category: this.category,
    price: this.price,
    depositAmount: this.depositAmount,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };

  if (isPopulated) {
    obj.freelancer = {
      id: this.freelancerId._id.toString(),
      name: this.freelancerId.name
    };
  }

  return obj;
};

const Gig = mongoose.model('Gig', gigSchema);
Gig.CATEGORIES = GIG_CATEGORIES;
Gig.STATUSES = GIG_STATUSES;

module.exports = Gig;