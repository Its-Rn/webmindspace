import mongoose from 'mongoose';

const { Schema } = mongoose;

const userRelationshipSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['contact', 'follow', 'favorite', 'team'],
      default: 'contact'
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'blocked'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userRelationshipSchema.index({ user: 1, relatedUser: 1, type: 1 }, { unique: true });

const UserRelationship = mongoose.model('UserRelationship', userRelationshipSchema);

export default UserRelationship;
