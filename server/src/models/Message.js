import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text'
    },
    attachmentUrl: {
      type: String,
      default: ''
    },
    deliveredTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    editedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
