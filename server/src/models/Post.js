import mongoose from 'mongoose';

const { Schema } = mongoose;

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    content: {
      type: String,
      default: ''
    },
    excerpt: {
      type: String,
      default: '',
      maxlength: 500
    },
    coverImage: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tags: {
      type: [String],
      default: []
    },
    categories: {
      type: [String],
      default: []
    },
    seo: {
      title: { type: String, default: '', maxlength: 120 },
      description: { type: String, default: '', maxlength: 320 },
      ogImage: { type: String, default: '' }
    },
    publishedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

postSchema.index({ author: 1, status: 1 });
postSchema.index({ status: 1, publishedAt: -1 });

postSchema.methods.toPostJSON = function toPostJSON() {
  return {
    id: this._id.toString(),
    title: this.title,
    slug: this.slug,
    content: this.content,
    excerpt: this.excerpt,
    coverImage: this.coverImage,
    status: this.status,
    author: this.author ? { id: this.author._id?.toString() || this.author.toString(), name: this.author.name } : null,
    tags: this.tags,
    categories: this.categories,
    seo: this.seo,
    publishedAt: this.publishedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Post = mongoose.model('Post', postSchema);

export default Post;
