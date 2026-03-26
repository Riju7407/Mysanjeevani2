import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        productId: String,
        productName: String,
        quantity: Number,
        price: Number,
        total: Number,
      },
    ],
    totalPrice: Number,
    totalItems: Number,
  },
  {
    timestamps: true,
  }
);

export const Cart =
  mongoose.models.Cart || mongoose.model('Cart', cartSchema);
