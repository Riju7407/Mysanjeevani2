import mongoose from 'mongoose';

const healthArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: String,
    content: String,
    summary: String,
    author: String,
    category: {
      type: String,
      enum: [
        'wellness',
        'disease',
        'nutrition',
        'fitness',
        'mental-health',
        'parenting',
        'senior-care',
      ],
      required: true,
    },
    image: String,
    tags: [String],
    relatedHealthConcerns: [String],
    viewCount: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    readTime: Number, // in minutes
  },
  {
    timestamps: true,
  }
);

export const HealthArticle =
  mongoose.models.HealthArticle ||
  mongoose.model('HealthArticle', healthArticleSchema);
