import mongoose from 'mongoose';

const { Schema } = mongoose;

const privacySettingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    whoCanSeeOnlineStatus: {
      type: String,
      enum: ['everyone', 'contacts', 'specific-users', 'nobody'],
      default: 'everyone'
    },
    whoCanSeeLastSeen: {
      type: String,
      enum: ['everyone', 'contacts', 'specific-users', 'nobody'],
      default: 'everyone'
    },
    whoCanSeeProfilePicture: {
      type: String,
      enum: ['everyone', 'contacts', 'specific-users', 'nobody'],
      default: 'everyone'
    },
    whoCanSeePhoneNumber: {
      type: String,
      enum: ['everyone', 'contacts', 'specific-users', 'nobody'],
      default: 'contacts'
    },
    whoCanSeeEmail: {
      type: String,
      enum: ['everyone', 'contacts', 'specific-users', 'nobody'],
      default: 'contacts'
    },
    whoCanMentionMe: {
      type: String,
      enum: ['everyone', 'contacts', 'specific-users', 'nobody'],
      default: 'everyone'
    },
    whoCanForwardMyMessages: {
      type: String,
      enum: ['everyone', 'contacts', 'specific-users', 'nobody'],
      default: 'contacts'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const PrivacySetting = mongoose.model('PrivacySetting', privacySettingSchema);

export default PrivacySetting;
