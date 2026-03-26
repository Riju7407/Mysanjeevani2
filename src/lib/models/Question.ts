import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
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
    question: {
      type: String,
      required: true,
    },
    userName: String,
    answers: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        answer: String,
        userName: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isAnswered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Question =
  mongoose.models.Question || mongoose.model('Question', questionSchema);
