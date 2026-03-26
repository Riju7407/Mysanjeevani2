import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    minCartValue: {
      type: Number,
      default: 0,
    },
    maxDiscount: Number,
    applicableCategories: [String],
    applicableBrands: [String],
    validFrom: Date,
    validUntil: Date,
    usageLimit: Number,
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    termsAndConditions: String,
  },
  {
    timestamps: true,
  }
);

export const Offer =
  mongoose.models.Offer || mongoose.model('Offer', offerSchema);
