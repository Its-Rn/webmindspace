import mongoose from 'mongoose';

const { Schema } = mongoose;

const timelinePostSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    mediaUrl: {
      type: String,
      default: ''
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

timelinePostSchema.index({ author: 1, createdAt: -1 });
timelinePostSchema.index({ isPinned: -1, createdAt: -1 });

timelinePostSchema.methods.toTimelineJSON = function toTimelineJSON() {
  return {
    id: this._id.toString(),
    content: this.content,
    mediaUrl: this.mediaUrl,
    author: this.author ? { id: this.author._id?.toString() || this.author.toString(), name: this.author.name, avatarUrl: this.author.avatarUrl } : null,
    isPinned: this.isPinned,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const TimelinePost = mongoose.model('TimelinePost', timelinePostSchema);

export default TimelinePost;
