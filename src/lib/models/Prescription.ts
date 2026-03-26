import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    prescriptionFile: String, // URL to uploaded file
    doctorName: String,
    hospitalName: String,
    issueDate: Date,
    expiryDate: Date,
    medicines: [
      {
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'expired', 'used'],
      default: 'active',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Prescription =
  mongoose.models.Prescription ||
  mongoose.model('Prescription', prescriptionSchema);
