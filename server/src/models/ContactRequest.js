import mongoose from 'mongoose';

const { Schema } = mongoose;

const contactRequestSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'blocked', 'expired'],
      default: 'pending'
    },
    respondedAt: {
      type: Date,
      default: null
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

contactRequestSchema.index({ sender: 1, recipient: 1, status: 1 });

const ContactRequest = mongoose.model('ContactRequest', contactRequestSchema);

export default ContactRequest;
