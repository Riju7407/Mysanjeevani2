import mongoose from 'mongoose';

const wellnessPillarSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
      trim: true,
    },
    benefits: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    cloudinaryPublicId: {
      type: String,
    },
    icon: {
      type: String,
      default: '💚',
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const WellnessPillar: mongoose.Model<any> =
  mongoose.models.WellnessPillar ||
  mongoose.model('WellnessPillar', wellnessPillarSchema);
