import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['chat', 'share', 'blog_comment', 'task_reminder', 'system'],
      required: true
    },
    senderName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    contentTitle: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    contentType: {
      type: String,
      default: '',
      trim: true,
      maxlength: 50
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    link: {
      type: String,
      default: ''
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
