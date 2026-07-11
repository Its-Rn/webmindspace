import mongoose from 'mongoose';

const { Schema } = mongoose;

const sharedContentSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    contentType: {
      type: String,
      enum: ['timeline', 'notes', 'blog'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

sharedContentSchema.index({ owner: 1, targetUser: 1, contentType: 1 }, { unique: true });
sharedContentSchema.index({ targetUser: 1, isActive: 1 });

const SharedContent = mongoose.model('SharedContent', sharedContentSchema);

export default SharedContent;