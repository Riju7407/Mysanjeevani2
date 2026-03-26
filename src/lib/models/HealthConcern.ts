import mongoose from 'mongoose';

const healthConcernSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: String,
    description: String,
    image: String,
    suggestedProducts: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
      },
    ],
    suggestedTests: [
      {
        testId: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
      },
    ],
    relatedArticles: [mongoose.Schema.Types.ObjectId],
    symptoms: [String],
    preventionTips: [String],
  },
  {
    timestamps: true,
  }
);

export const HealthConcern =
  mongoose.models.HealthConcern ||
  mongoose.model('HealthConcern', healthConcernSchema);
