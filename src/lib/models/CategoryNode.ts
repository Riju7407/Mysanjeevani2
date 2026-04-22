import mongoose from 'mongoose';

const categoryNodeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CategoryNode',
      default: null,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

categoryNodeSchema.index({ parentId: 1, sortOrder: 1, name: 1 });

export const CategoryNode =
  mongoose.models.CategoryNode || mongoose.model('CategoryNode', categoryNodeSchema);
