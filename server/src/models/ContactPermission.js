import mongoose from 'mongoose';

const { Schema } = mongoose;

const contactPermissionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    whoCanMessageMe: {
      type: String,
      enum: ['everyone', 'registered-users', 'contacts', 'following', 'same-role', 'team', 'specific-users', 'nobody'],
      default: 'everyone'
    },
    whoCanAddMeToGroups: {
      type: String,
      enum: ['everyone', 'contacts', 'following', 'same-role', 'team', 'specific-users', 'nobody'],
      default: 'everyone'
    },
    allowedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    blockedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    allowSelectedUsersOnly: {
      type: Boolean,
      default: false
    },
    allowContactRequests: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const ContactPermission = mongoose.model('ContactPermission', contactPermissionSchema);

export default ContactPermission;
