import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: String,
    price: Number,
    image: String,
  },
  {
    timestamps: true,
  }
);

export const Wishlist =
  mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
