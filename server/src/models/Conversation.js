import mongoose from 'mongoose';

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    lastMessage: {
      content: { type: String, default: '' },
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      sentAt: { type: Date }
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {}
    },
    isGroup: {
      type: Boolean,
      default: false
    },
    pinnedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    name: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    avatarUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ 'lastMessage.sentAt': -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
