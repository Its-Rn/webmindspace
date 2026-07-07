import mongoose from 'mongoose';

const { Schema } = mongoose;

const noteSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'Untitled',
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      default: '',
      maxlength: 50000
    },
    tags: {
      type: [String],
      default: [],
      set: (tags) => [...new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean))]
    },
    color: {
      type: String,
      default: '',
      maxlength: 20
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    wordCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

noteSchema.index({ author: 1, isArchived: 1, isPinned: -1, updatedAt: -1 });
noteSchema.index({ author: 1, tags: 1 });

noteSchema.pre('save', function computeWordCount() {
  if (this.isModified('content')) {
    const text = this.content.replace(/<[^>]*>/g, '');
    this.wordCount = text ? text.split(/\s+/).length : 0;
  }
});

const Note = mongoose.model('Note', noteSchema);

export default Note;
