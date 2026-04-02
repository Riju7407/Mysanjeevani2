import mongoose from 'mongoose';

const phoneOtpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'vendor', 'doctor'],
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    consumed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

phoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PhoneOtp =
  mongoose.models.PhoneOtp || mongoose.model('PhoneOtp', phoneOtpSchema);
