import mongoose from 'mongoose';

const featuredProductSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
    },
    cardBgColor: {
      type: String,
      default: '#ffffff',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String, // Admin user ID
    },
  },
  {
    timestamps: true,
  }
);

// Sort by newest by default
featuredProductSchema.statics.getOrdered = function () {
  return this.find().sort({ createdAt: -1 });
};

const existingFeaturedProductModel = mongoose.models.FeaturedProduct as
  | mongoose.Model<any>
  | undefined;

// In dev hot-reload, an older cached model can miss newly added fields.
if (existingFeaturedProductModel && !existingFeaturedProductModel.schema.path('cardBgColor')) {
  existingFeaturedProductModel.schema.add({
    cardBgColor: {
      type: String,
      default: '#ffffff',
    },
  });
}

export const FeaturedProduct: mongoose.Model<any> =
  existingFeaturedProductModel ||
  mongoose.model('FeaturedProduct', featuredProductSchema);
