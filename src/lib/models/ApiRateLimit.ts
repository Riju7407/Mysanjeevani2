import mongoose from 'mongoose';

const apiRateLimitSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    resetAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

apiRateLimitSchema.index({ action: 1, key: 1 }, { unique: true });
apiRateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export const ApiRateLimit =
  mongoose.models.ApiRateLimit ||
  mongoose.model('ApiRateLimit', apiRateLimitSchema);
