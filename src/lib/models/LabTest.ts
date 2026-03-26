import mongoose from 'mongoose';

const labTestSchema = new mongoose.Schema(
  {
    testId: String,
    testName: {
      type: String,
      required: true,
    },
    description: String,
    price: Number,
    homeCollectionAvailable: {
      type: Boolean,
      default: true,
    },
    centerCollectionAvailable: {
      type: Boolean,
      default: true,
    },
    reportTime: String, // e.g., "24 hours"
    sampleType: String, // e.g., "blood", "urine"
    fasting: {
      type: Boolean,
      default: false,
    },
    fastingHours: Number,
    category: String, // e.g., "cardiac", "diabetic", "general"
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    reviews: Number,
    image: String,
    icon: { type: String, default: '🧪' },
    mrp: Number,
    popular: { type: Boolean, default: false },
    testsIncluded: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LabTest =
  mongoose.models.LabTest || mongoose.model('LabTest', labTestSchema);
