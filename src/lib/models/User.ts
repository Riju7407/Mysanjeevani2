import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide a full name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      default: '',
    },
    fullAddress: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'vendor', 'doctor', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Doctor specific fields
    registrationNumber: {
      type: String,
      default: '',
    },
    identityDocument: {
      type: String, // URL to uploaded image (medical license, ID card, etc.)
      default: '',
    },
    identityDocumentType: {
      type: String,
      enum: ['medical-license', 'doctor-id', 'nmc-registration', 'other'],
      default: 'medical-license',
    },
    isApproved: {
      type: Boolean,
      default: false, // Doctor can only login after approval
    },
    approvalNote: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: String, // Admin email who approved
      default: '',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User =
  mongoose.models.User || mongoose.model('User', userSchema);
