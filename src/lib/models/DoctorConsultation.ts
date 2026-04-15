import mongoose from 'mongoose';

const doctorConsultationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    // Denormalized for quick reads
    patientName: { type: String, required: true },
    patientPhone: { type: String, default: '' },
    patientEmail: { type: String, default: '' },
    doctorName: { type: String, required: true },
    doctorDepartment: { type: String, default: '' },
    doctorSpecialization: { type: String, default: '' },

    // Booking details
    appointmentDate: { type: Date, required: true },
    preferredTimeSlot: { type: String, default: '' }, // user-selected window e.g. "09:00 - 13:00"
    allottedTime: { type: String, default: '' },      // doctor-confirmed exact time e.g. "10:30"

    consultationType: {
      type: String,
      enum: ['video', 'audio', 'in-person'],
      default: 'in-person',
    },

    // Queue position
    queueNumber: { type: Number, default: 0 },
    patientsAhead: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },

    fees: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: { type: String, default: 'razorpay' },
    paymentGateway: { type: String, default: 'razorpay' },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    refundId: { type: String, default: '' },
    refundedAt: { type: Date, default: null },
    symptoms: { type: String, default: '' },
    notes: { type: String, default: '' },
    prescription: { type: String, default: '' },

    rating: { type: Number, min: 0, max: 5 },
    feedback: { type: String, default: '' },
  },
  { timestamps: true }
);

export const DoctorConsultation =
  mongoose.models.DoctorConsultation ||
  mongoose.model('DoctorConsultation', doctorConsultationSchema);
