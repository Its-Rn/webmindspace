import BlockedUser from '../models/BlockedUser.js';
import ChatPolicy from '../models/ChatPolicy.js';
import ContactPermission from '../models/ContactPermission.js';
import PrivacySetting from '../models/PrivacySetting.js';
import UserRelationship from '../models/UserRelationship.js';

const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

const defaultPolicy = {
  isEnabled: true,
  allowAdminOverride: true,
  roleRules: [
    { role: 'guest', canInitiateTo: [], canReceiveFrom: [], canCreateGroups: false, requiresContactRequest: true },
    { role: 'user', canInitiateTo: ['admin', 'writer', 'moderator', 'user'], canReceiveFrom: ['admin', 'writer', 'moderator', 'user'], canCreateGroups: true, requiresContactRequest: true },
    { role: 'writer', canInitiateTo: ['admin', 'writer'], canReceiveFrom: ['admin', 'writer', 'moderator'], canCreateGroups: true, requiresContactRequest: false },
    { role: 'moderator', canInitiateTo: ['everyone'], canReceiveFrom: ['everyone'], canCreateGroups: true, requiresContactRequest: false },
    { role: 'admin', canInitiateTo: ['everyone'], canReceiveFrom: ['everyone'], canCreateGroups: true, requiresContactRequest: false }
  ]
};

const cloneDefaultPermission = (userId) => ({
  user: userId,
  whoCanMessageMe: 'everyone',
  whoCanAddMeToGroups: 'everyone',
  allowedUsers: [],
  blockedUsers: [],
  allowSelectedUsersOnly: false,
  allowContactRequests: true
});

const cloneDefaultPrivacy = (userId) => ({
  user: userId,
  whoCanSeeOnlineStatus: 'everyone',
  whoCanSeeLastSeen: 'everyone',
  whoCanSeeProfilePicture: 'everyone',
  whoCanSeePhoneNumber: 'contacts',
  whoCanSeeEmail: 'contacts',
  whoCanMentionMe: 'everyone',
  whoCanForwardMyMessages: 'contacts'
});

export const getChatPolicy = async () => {
  const policy = await ChatPolicy.findOne().lean();
  if (!policy) return defaultPolicy;
  return {
    ...defaultPolicy,
    ...policy,
    roleRules: Array.isArray(policy.roleRules) && policy.roleRules.length ? policy.roleRules : defaultPolicy.roleRules
  };
};

export const saveChatPolicy = async (payload) => {
  const policy = await ChatPolicy.findOneAndUpdate(
    {},
    {
      $set: {
        isEnabled: payload.isEnabled ?? true,
        allowAdminOverride: payload.allowAdminOverride ?? true,
        roleRules: payload.roleRules || defaultPolicy.roleRules
      }
    },
    { upsert: true, new: true }
  ).lean();

  return policy;
};

export const getContactPermission = async (userId) => {
  const permission = await ContactPermission.findOne({ user: userId }).lean();
  return permission || cloneDefaultPermission(userId);
};

export const upsertContactPermission = async (userId, payload) => {
  const permission = await ContactPermission.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        whoCanMessageMe: payload.whoCanMessageMe ?? 'everyone',
        whoCanAddMeToGroups: payload.whoCanAddMeToGroups ?? 'everyone',
        allowedUsers: payload.allowedUsers || [],
        blockedUsers: payload.blockedUsers || [],
        allowSelectedUsersOnly: Boolean(payload.allowSelectedUsersOnly),
        allowContactRequests: payload.allowContactRequests !== false
      }
    },
    { upsert: true, new: true }
  ).lean();

  return permission;
};

export const getPrivacySetting = async (userId) => {
  const setting = await PrivacySetting.findOne({ user: userId }).lean();
  return setting || cloneDefaultPrivacy(userId);
};

export const upsertPrivacySetting = async (userId, payload) => {
  const setting = await PrivacySetting.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        whoCanSeeOnlineStatus: payload.whoCanSeeOnlineStatus ?? 'everyone',
        whoCanSeeLastSeen: payload.whoCanSeeLastSeen ?? 'everyone',
        whoCanSeeProfilePicture: payload.whoCanSeeProfilePicture ?? 'everyone',
        whoCanSeePhoneNumber: payload.whoCanSeePhoneNumber ?? 'contacts',
        whoCanSeeEmail: payload.whoCanSeeEmail ?? 'contacts',
        whoCanMentionMe: payload.whoCanMentionMe ?? 'everyone',
        whoCanForwardMyMessages: payload.whoCanForwardMyMessages ?? 'contacts'
      }
    },
    { upsert: true, new: true }
  ).lean();

  return setting;
};

export const listBlockedUsers = async (userId) => {
  return BlockedUser.find({ blocker: userId })
    .populate('blockedUser', 'name username email avatarUrl role isEmailVerified lastActiveAt')
    .sort({ createdAt: -1 })
    .lean();
};

export const blockUser = async (blockerId, blockedUserId, reason = '', blockedByAdmin = false) => {
  const blocked = await BlockedUser.findOneAndUpdate(
    { blocker: blockerId, blockedUser: blockedUserId },
    {
      $set: {
        reason: String(reason || '').trim().slice(0, 250),
        blockedByAdmin
      }
    },
    { upsert: true, new: true }
  ).lean();

  await UserRelationship.findOneAndUpdate(
    { user: blockerId, relatedUser: blockedUserId, type: 'contact' },
    { $set: { status: 'blocked' } },
    { upsert: true, new: true }
  );

  return blocked;
};

export const unblockUser = async (blockerId, blockedUserId) => {
  await BlockedUser.deleteOne({ blocker: blockerId, blockedUser: blockedUserId });
  await UserRelationship.updateOne(
    { user: blockerId, relatedUser: blockedUserId, type: 'contact' },
    { $set: { status: 'active' } }
  );

  return { success: true };
};

export const hasBlocked = async (blockerId, blockedUserId) => {
  return Boolean(await BlockedUser.exists({ blocker: blockerId, blockedUser: blockedUserId }));
};

export const isUserOnline = (user) => {
  if (!user?.lastActiveAt) return false;
  return Date.now() - new Date(user.lastActiveAt).getTime() < ACTIVE_WINDOW_MS;
};

export const getRelationship = async (userId, relatedUserId, type) => {
  return UserRelationship.findOne({ user: userId, relatedUser: relatedUserId, type, status: 'active' }).lean();
};

const matchesScope = async ({ scope, viewerId, targetUser, ownerId, ownerRole }) => {
  switch (scope) {
    case 'everyone':
      return true;
    case 'registered-users':
      return Boolean(viewerId);
    case 'contacts':
      return Boolean(await getRelationship(ownerId, viewerId, 'contact') || await getRelationship(viewerId, ownerId, 'contact'));
    case 'following':
      return Boolean(await getRelationship(ownerId, viewerId, 'follow'));
    case 'same-role':
      return targetUser?.role === ownerRole;
    case 'team':
      return Boolean(await getRelationship(ownerId, viewerId, 'team'));
    case 'specific-users':
      return false;
    case 'nobody':
      return false;
    default:
      return true;
  }
};

export const canDirectMessage = async ({ sender, recipient, policy = null, adminOverride = false }) => {
  if (!sender || !recipient) {
    return { allowed: false, reason: 'User not found.' };
  }

  if (!sender.isActive || !recipient.isActive) {
    return { allowed: false, reason: 'One of the accounts is inactive.' };
  }

  if (sender.chatEnabled === false || recipient.chatEnabled === false) {
    return { allowed: false, reason: 'Chat is disabled for one of the accounts.' };
  }

  const activePolicy = policy || (await getChatPolicy());
  const senderRoleRule = activePolicy.roleRules.find((rule) => rule.role === sender.role) || activePolicy.roleRules.find((rule) => rule.role === 'user');
  const recipientRoleRule = activePolicy.roleRules.find((rule) => rule.role === recipient.role) || activePolicy.roleRules.find((rule) => rule.role === 'user');

  const senderAllowed = senderRoleRule?.canInitiateTo?.includes('everyone') || senderRoleRule?.canInitiateTo?.includes(recipient.role);
  const recipientAllowed = recipientRoleRule?.canReceiveFrom?.includes('everyone') || recipientRoleRule?.canReceiveFrom?.includes(sender.role);
  const policyAllows = senderAllowed && recipientAllowed;

  if (!policyAllows && !(adminOverride && activePolicy.allowAdminOverride && sender.role === 'admin')) {
    return { allowed: false, reason: 'Role-based messaging rules do not allow this conversation.' };
  }

  const senderBlockedRecipient = await hasBlocked(sender._id, recipient._id);
  const recipientBlockedSender = await hasBlocked(recipient._id, sender._id);

  if (senderBlockedRecipient || recipientBlockedSender) {
    return { allowed: false, reason: 'This user is blocked.' };
  }

  const permission = await getContactPermission(recipient._id);
  const specificUserAllowed = permission.allowedUsers?.some?.((id) => id.toString() === sender._id.toString());
  const recipientBlockedSenderByPermission = permission.blockedUsers?.some?.((id) => id.toString() === sender._id.toString());

  if (recipientBlockedSenderByPermission) {
    return { allowed: false, reason: 'This user is blocked by privacy settings.' };
  }

  if (permission.allowSelectedUsersOnly && !specificUserAllowed && sender.role !== 'admin') {
    return { allowed: false, reason: 'This user only allows selected contacts.' };
  }

  if (permission.whoCanMessageMe === 'nobody' && sender.role !== 'admin' && !specificUserAllowed) {
    return { allowed: false, reason: 'This user is not accepting messages.' };
  }

  if (permission.whoCanMessageMe === 'specific-users') {
    if (!specificUserAllowed && sender.role !== 'admin') {
      return { allowed: false, reason: 'This user only allows specific users.' };
    }
  } else if (permission.whoCanMessageMe !== 'everyone') {
    const scopeAllowed = await matchesScope({
      scope: permission.whoCanMessageMe,
      viewerId: sender._id,
      targetUser: sender,
      ownerId: recipient._id,
      ownerRole: recipient.role
    });

    if (!scopeAllowed && sender.role !== 'admin') {
      return {
        allowed: false,
        reason: 'You cannot send messages to this user because their privacy settings restrict who can contact them.',
        requiresContactRequest: permission.allowContactRequests
      };
    }
  }

  return {
    allowed: true,
    requiresContactRequest: false,
    permission
  };
};

export const canCreateGroup = async ({ creator, policy = null }) => {
  const activePolicy = policy || (await getChatPolicy());
  if (!creator?.isActive || creator.chatEnabled === false) {
    return { allowed: false, reason: 'Your account cannot start chats right now.' };
  }

  if (creator.role === 'guest') {
    return { allowed: false, reason: 'Guest accounts cannot initiate chats.' };
  }

  const roleRule = activePolicy.roleRules.find((rule) => rule.role === creator.role);
  if (roleRule && roleRule.canCreateGroups === false) {
    return { allowed: false, reason: 'Your role cannot create group chats.' };
  }

  return { allowed: true };
};

export const canAddToGroup = async ({ owner, member, policy = null }) => {
  const activePolicy = policy || (await getChatPolicy());
  const senderRule = activePolicy.roleRules.find((rule) => rule.role === owner.role) || activePolicy.roleRules.find((rule) => rule.role === 'user');
  const recipientRule = activePolicy.roleRules.find((rule) => rule.role === member.role) || activePolicy.roleRules.find((rule) => rule.role === 'user');

  if (!senderRule || !recipientRule) {
    return { allowed: false, reason: 'Role rules are unavailable.' };
  }

  const ownerAllowed = senderRule.canInitiateTo.includes('everyone') || senderRule.canInitiateTo.includes(member.role);
  const memberAllowed = recipientRule.canReceiveFrom.includes('everyone') || recipientRule.canReceiveFrom.includes(owner.role);
  if (!ownerAllowed || !memberAllowed) {
    return { allowed: false, reason: 'One of the members cannot be added based on role rules.' };
  }

  const permission = await getContactPermission(member._id);
  if (permission.whoCanAddMeToGroups === 'nobody' && owner.role !== 'admin') {
    return { allowed: false, reason: 'This user does not allow group invites.' };
  }

  return { allowed: true };
};

export const canSeeVisibility = async ({ viewer, owner, field }) => {
  const setting = await getPrivacySetting(owner._id);
  const scope = setting[field] || 'everyone';
  if (viewer._id.toString() === owner._id.toString()) return true;
  if (viewer.role === 'admin') return true;
  if (scope === 'everyone') return true;
  if (scope === 'nobody') return false;
  if (scope === 'contacts') {
    return Boolean(await getRelationship(owner._id, viewer._id, 'contact') || await getRelationship(viewer._id, owner._id, 'contact'));
  }
  if (scope === 'specific-users') {
    const permission = await getContactPermission(owner._id);
    return permission.allowedUsers?.some?.((id) => id.toString() === viewer._id.toString());
  }
  return false;
};
