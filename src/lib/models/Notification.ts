import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'order',
        'delivery',
        'appointment',
        'prescription',
        'promotion',
        'health-tip',
      ],
      required: true,
    },
    title: String,
    message: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    isRead: {
      type: Boolean,
      default: false,
    },
    actionUrl: String,
  },
  {
    timestamps: true,
  }
);

export const Notification =
  mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);
