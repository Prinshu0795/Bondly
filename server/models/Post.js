const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    username: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment must be at most 500 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    username: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
      },
      username: {
        type: String,
        required: true,
      },
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Post text must be at most 2000 characters'],
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    likes: [likeSchema],
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Index for feed ordering (newest first)
postSchema.index({ createdAt: -1 });

// Custom validation: at least text or image must be provided
postSchema.pre('validate', function (next) {
  const hasText = this.text && this.text.trim().length > 0;
  const hasImage = this.imageUrl && this.imageUrl.trim().length > 0;
  if (!hasText && !hasImage) {
    this.invalidate('text', 'Post must contain at least text or an image');
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
