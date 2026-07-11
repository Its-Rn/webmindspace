import mongoose from 'mongoose';

const { Schema } = mongoose;

const roleRuleSchema = new Schema(
  {
    role: {
      type: String,
      enum: ['guest', 'user', 'writer', 'moderator', 'admin'],
      required: true
    },
    canInitiateTo: {
      type: [String],
      default: ['everyone']
    },
    canReceiveFrom: {
      type: [String],
      default: ['everyone']
    },
    canCreateGroups: {
      type: Boolean,
      default: true
    },
    requiresContactRequest: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const chatPolicySchema = new Schema(
  {
    isEnabled: {
      type: Boolean,
      default: true
    },
    allowAdminOverride: {
      type: Boolean,
      default: true
    },
    roleRules: {
      type: [roleRuleSchema],
      default: [
        { role: 'guest', canInitiateTo: [], canReceiveFrom: [], canCreateGroups: false, requiresContactRequest: true },
        { role: 'user', canInitiateTo: ['admin', 'writer', 'moderator', 'user'], canReceiveFrom: ['admin', 'writer', 'moderator', 'user'], canCreateGroups: true, requiresContactRequest: true },
        { role: 'writer', canInitiateTo: ['admin', 'writer'], canReceiveFrom: ['admin', 'writer', 'moderator'], canCreateGroups: true, requiresContactRequest: false },
        { role: 'moderator', canInitiateTo: ['everyone'], canReceiveFrom: ['everyone'], canCreateGroups: true, requiresContactRequest: false },
        { role: 'admin', canInitiateTo: ['everyone'], canReceiveFrom: ['everyone'], canCreateGroups: true, requiresContactRequest: false }
      ]
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const ChatPolicy = mongoose.model('ChatPolicy', chatPolicySchema);

export default ChatPolicy;
