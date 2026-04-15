import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true },   // e.g. "13:00"
    maxPatients: { type: Number, default: 20 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: '' },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    identityDocumentUrl: {
      type: String,
      default: '',
    },
    identityDocumentType: {
      type: String,
      enum: ['medical-license', 'doctor-id', 'nmc-registration', 'other'],
      default: 'medical-license',
    },
    aadharCardUrl: {
      type: String,
      default: '',
    },
    panCardUrl: {
      type: String,
      default: '',
    },
    registrationCertificateUrl: {
      type: String,
      default: '',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvalNote: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: String,
      default: '',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    department: {
      type: String,
      enum: [
        'General Medicine',
        'Cardiology',
        'Dermatology',
        'Pediatrics',
        'Orthopedics',
        'Neurology',
        'Gynecology',
        'ENT',
        'Ophthalmology',
        'Psychiatry',
        'Oncology',
        'Urology',
        'Gastroenterology',
        'Endocrinology',
        'Pulmonology',
      ],
      default: 'General Medicine',
    },
    specialization: { type: String, default: '' },
    experience: { type: Number, default: 0 }, // years
    qualification: { type: String, default: '' },
    bio: { type: String, default: '' },
    consultationFee: { type: Number, default: 0 },
    // Stored as YYYY-MM-DD values selected by doctor for booking availability.
    availableDates: { type: [String], default: [] },
    timeSlots: [timeSlotSchema],
    isAvailable: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    avatar: { type: String, default: '' }, // emoji or URL
  },
  { timestamps: true }
);

export const Doctor =
  mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);
