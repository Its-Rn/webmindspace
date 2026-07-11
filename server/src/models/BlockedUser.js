import mongoose from 'mongoose';

const { Schema } = mongoose;

const blockedUserSchema = new Schema(
  {
    blocker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    blockedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 250
    },
    blockedByAdmin: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

blockedUserSchema.index({ blocker: 1, blockedUser: 1 }, { unique: true });

const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);

export default BlockedUser;
