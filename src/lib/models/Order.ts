import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    deliveryAddress: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    orderNotes: String,
  },
  {
    timestamps: true,
  }
);

export const Order =
  mongoose.models.Order || mongoose.model('Order', orderSchema);
