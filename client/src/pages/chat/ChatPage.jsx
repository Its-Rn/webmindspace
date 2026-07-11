import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  FiUser,
  FiPlus,
  FiSend,
  FiSearch,
  FiChevronLeft,
  FiTrash2,
  FiCheck,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiStar,
  FiCircle,
  FiHash,
  FiX,
  FiFilter,
  FiShield,
  FiLock,
  FiUserCheck
} from 'react-icons/fi';
import { chatApi, getSocket } from '../../services/chat';

const CHANNEL_PREFIX = 'private-';

const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatLastSeen = (date) => {
  if (!date) return 'Last seen recently';
  const diff = Date.now() - new Date(date).getTime();
  if (Number.isNaN(diff)) return 'Last seen recently';
  if (diff < ACTIVE_WINDOW_MS) return 'Online';
  if (diff < 3600000) return `Last seen ${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (diff < 86400000) return `Last seen ${Math.floor(diff / 3600000)}h ago`;
  return `Last seen ${new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
};

const getConversationLabel = (conversation, currentUserId) => {
  if (conversation.isGroup) return conversation.name || 'Group chat';
  const other = conversation.participants?.find((participant) => participant._id !== currentUserId);
  return other?.name || conversation.participants?.[0]?.name || 'You';
};

const getConversationAvatarLabel = (conversation, currentUserId) => {
  if (conversation.isGroup) return 'G';
  const other = conversation.participants?.find((participant) => participant._id !== currentUserId);
  return other?.name?.[0]?.toUpperCase() || '?';
};

const isUserOnline = (user) => {
  if (!user?.lastActiveAt) return false;
  return Date.now() - new Date(user.lastActiveAt).getTime() < ACTIVE_WINDOW_MS;
};

const ChatPage = () => {
  const outletContext = useOutletContext();
  const user = outletContext?.currentUser || null;
  const queryClient = useQueryClient();
  const [activeConversation, setActiveConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [directoryFilter, setDirectoryFilter] = useState('all');
  const [directorySearch, setDirectorySearch] = useState('');
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);
  const [contactForm, setContactForm] = useState(null);
  const [privacyForm, setPrivacyForm] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [conversationTyping, setConversationTyping] = useState({});
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const convChannelRef = useRef(null);
  const userChannelRef = useRef(null);

  const { data: conversationsData, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(),
    refetchInterval: 30000
  });

  const { data: messagesData, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', activeConversation?._id],
    queryFn: () => chatApi.getMessages(activeConversation._id),
    enabled: !!activeConversation?._id
  });

  const { data: groupSearchData } = useQuery({
    queryKey: ['group-search-users', groupSearchQuery],
    queryFn: () => chatApi.searchUsers(groupSearchQuery),
    enabled: showGroupModal && groupSearchQuery.length >= 2
  });

  const { data: directoryData, isLoading: directoryLoading } = useQuery({
    queryKey: ['chat-directory', directorySearch, directoryFilter],
    queryFn: () => chatApi.getUsers({ q: directorySearch, filter: directoryFilter }),
    refetchOnWindowFocus: false
  });

  const { data: contactPermissionData } = useQuery({
    queryKey: ['chat-contact-permission'],
    queryFn: () => chatApi.getMyContactPermission(),
    enabled: showPrivacyPanel
  });

  const { data: privacySettingData } = useQuery({
    queryKey: ['chat-privacy-setting'],
    queryFn: () => chatApi.getMyPrivacySetting(),
    enabled: showPrivacyPanel
  });

  const { data: blockedUsersData } = useQuery({
    queryKey: ['chat-blocked-users'],
    queryFn: () => chatApi.getBlockedUsers(),
    enabled: showPrivacyPanel
  });

  const { data: contactRequestsData } = useQuery({
    queryKey: ['chat-contact-requests'],
    queryFn: () => chatApi.getContactRequests(),
    enabled: showPrivacyPanel
  });

  const sendMutation = useMutation({
    mutationFn: ({ conversationId, content }) =>
      chatApi.sendMessage(conversationId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversation?._id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const startConvMutation = useMutation({
    mutationFn: (userId) => chatApi.getOrCreateConversation(userId),
    onSuccess: (data) => {
      setActiveConversation(data.data.data);
      setDirectorySearch('');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: (payload) => chatApi.createGroupConversation(payload),
    onSuccess: (data) => {
      setActiveConversation(data.data.data);
      setShowGroupModal(false);
      setGroupName('');
      setGroupSearchQuery('');
      setSelectedGroupMembers([]);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const pinConversationMutation = useMutation({
    mutationFn: (conversationId) => chatApi.togglePinConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const updateContactPermissionMutation = useMutation({
    mutationFn: (payload) => chatApi.updateMyContactPermission(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-contact-permission'] });
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
    }
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: (payload) => chatApi.updateMyPrivacySetting(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-privacy-setting'] });
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
    }
  });

  const blockUserMutation = useMutation({
    mutationFn: (payload) => chatApi.blockUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const unblockUserMutation = useMutation({
    mutationFn: (userId) => chatApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
    }
  });

  const contactRequestMutation = useMutation({
    mutationFn: (payload) => chatApi.createContactRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-contact-requests'] });
    }
  });

  const respondContactRequestMutation = useMutation({
    mutationFn: ({ requestId, action }) => chatApi.respondToContactRequest(requestId, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-contact-requests'] });
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (userId) => chatApi.toggleFavoriteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
    }
  });

  const deleteMsgMutation = useMutation({
    mutationFn: (messageId) => chatApi.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversation?._id] });
    }
  });

  const unsendMsgMutation = useMutation({
    mutationFn: (messageId) => chatApi.unsendMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversation?._id] });
    }
  });

  const conversations = conversationsData?.data?.data || [];
  const messages = messagesData?.data?.data || [];
  const directoryUsers = directoryData?.data?.data || [];
  const myContactPermission = contactPermissionData?.data?.data || null;
  const myPrivacySetting = privacySettingData?.data?.data || null;
  const blockedUsers = blockedUsersData?.data?.data || [];
  const contactRequests = contactRequestsData?.data?.data || [];
  const currentUserId = user?.id || '';

  useEffect(() => {
    if (!myContactPermission) return;
    setContactForm({
      whoCanMessageMe: myContactPermission.whoCanMessageMe || 'everyone',
      whoCanAddMeToGroups: myContactPermission.whoCanAddMeToGroups || 'everyone',
      allowContactRequests: myContactPermission.allowContactRequests !== false
    });
  }, [myContactPermission]);

  useEffect(() => {
    if (!myPrivacySetting) return;
    setPrivacyForm({
      whoCanSeeOnlineStatus: myPrivacySetting.whoCanSeeOnlineStatus || 'everyone',
      whoCanSeeLastSeen: myPrivacySetting.whoCanSeeLastSeen || 'everyone',
      whoCanSeeProfilePicture: myPrivacySetting.whoCanSeeProfilePicture || 'everyone',
      whoCanSeePhoneNumber: myPrivacySetting.whoCanSeePhoneNumber || 'contacts',
      whoCanSeeEmail: myPrivacySetting.whoCanSeeEmail || 'contacts',
      whoCanMentionMe: myPrivacySetting.whoCanMentionMe || 'everyone',
      whoCanForwardMyMessages: myPrivacySetting.whoCanForwardMyMessages || 'contacts'
    });
  }, [myPrivacySetting]);

  const conversationsView = useMemo(() => {
    const mapped = conversations.map((conversation) => {
      const isPinned = Array.isArray(conversation.pinnedBy)
        ? conversation.pinnedBy.some((id) => id?.toString?.() === currentUserId.toString())
        : false;
      const latestTime = conversation.lastMessage?.sentAt || conversation.updatedAt || conversation.createdAt;
      return {
        ...conversation,
        isPinned,
        latestTime
      };
    });

    return mapped.sort((left, right) => {
      if (left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;
      return new Date(right.latestTime || 0) - new Date(left.latestTime || 0);
    });
  }, [conversations, currentUserId]);

  const unreadCount = useCallback(
    (conv) => {
      return Number(conv.unreadCounts?.[currentUserId] || 0);
    },
    [currentUserId]
  );

  const typingPreview = useCallback(
    (convId) => {
      const typingState = conversationTyping[convId];
      if (!typingState) return '';
      if (typingState.userName) return `${typingState.userName} is typing...`;
      return 'Typing...';
    },
    [conversationTyping]
  );

  const getConversationPreview = useCallback(
    (conv) => {
      const typing = typingPreview(conv._id);
      if (typing) return typing;
      if (conv.isGroup) {
        return conv.lastMessage?.content || 'No messages yet';
      }
      const other = conv.participants?.find((participant) => participant._id !== currentUserId);
      const prefix = isUserOnline(other) ? 'Online · ' : `${formatLastSeen(other?.lastActiveAt)} · `;
      return `${prefix}${conv.lastMessage?.content || 'No messages yet'}`;
    },
    [currentUserId, typingPreview]
  );

  const sectionedConversations = useMemo(() => {
    const pinned = conversationsView.filter((conversation) => conversation.isPinned);
    const groups = conversationsView.filter((conversation) => conversation.isGroup && !conversation.isPinned);
    const unread = conversationsView.filter(
      (conversation) => !conversation.isGroup && !conversation.isPinned && unreadCount(conversation) > 0
    );
    const recent = conversationsView.filter(
      (conversation) => !conversation.isGroup && !conversation.isPinned && unreadCount(conversation) === 0
    );
    return { pinned, groups, unread, recent };
  }, [conversationsView, unreadCount]);

  const directoryFilters = [
    { label: 'All Users', value: 'all' },
    { label: 'Online', value: 'online' },
    { label: 'Favorites', value: 'favorites' },
    { label: 'Recent Chats', value: 'recent' },
    { label: 'Groups', value: 'groups' },
    { label: 'Admins', value: 'admins' },
    { label: 'Writers', value: 'writers' },
    { label: 'Users', value: 'users' }
  ];

  const handleStartChat = (targetUserId) => {
    startConvMutation.mutate(targetUserId, {
      onError: (error) => {
        const message = error?.response?.data?.message || error?.message || 'You cannot start that conversation right now.';
        window.alert(message);
      }
    });
  };

  const handleSavePrivacy = () => {
    if (!privacyForm) return;
    updatePrivacyMutation.mutate(privacyForm);
  };

  const handleSaveContactPermission = () => {
    if (!contactForm) return;
    updateContactPermissionMutation.mutate(contactForm);
  };

  const handleToggleFavorite = (userId) => {
    toggleFavoriteMutation.mutate(userId);
  };

  const handleBlockDirectoryUser = (userId) => {
    blockUserMutation.mutate({ userId });
  };

  const handleSendContactRequest = (recipientId) => {
    contactRequestMutation.mutate({ recipientId, message: 'Requesting permission to chat.' });
  };

  const formatDirectoryLastSeen = (entry) => {
    if (!entry?.lastSeenAt) return entry?.isOnline ? 'Online' : 'Hidden';
    return formatLastSeen(entry.lastSeenAt);
  };

  const renderDirectoryCard = (entry) => {
    return (
      <div key={entry._id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-3">
        <div className="flex items-start gap-3">
          <div className="relative">
            {entry.avatarUrl ? (
              <img src={entry.avatarUrl} alt={entry.name} className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-white">
                {entry.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[rgb(var(--bg-elevated))] ${
                entry.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{entry.name}</p>
                <p className="truncate text-xs text-slate-500">@{entry.username || entry.email?.split('@')[0]}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleFavorite(entry._id)}
                className={`rounded-full p-1.5 ${entry.isFavorite ? 'text-amber-500' : 'text-slate-400'}`}
                title={entry.isFavorite ? 'Remove favorite' : 'Add favorite'}
              >
                <FiStar className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--bg))] px-2 py-1">
                <FiShield className="h-3 w-3" />
                {entry.role}
              </span>
              {entry.isEmailVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-600">
                  <FiUserCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
              <span>{formatDirectoryLastSeen(entry)}</span>
            </div>
            <p className="mt-2 line-clamp-1 text-xs text-slate-500">
              {entry.lastMessagePreview || 'No messages yet'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span>{entry.mutualGroupsCount || 0} mutual groups</span>
              <span>{entry.unreadCount || 0} unread</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStartChat(entry._id)}
                className="primary-button px-3 py-1.5 text-xs"
              >
                Message
              </button>
              <button
                type="button"
                onClick={() => handleSendContactRequest(entry._id)}
                className="secondary-button px-3 py-1.5 text-xs"
              >
                Contact request
              </button>
              <button
                type="button"
                onClick={() => handleBlockDirectoryUser(entry._id)}
                className="secondary-button px-3 py-1.5 text-xs text-red-500"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const toggleGroupMember = (member) => {
    setSelectedGroupMembers((current) =>
      current.some((existing) => existing._id === member._id)
        ? current.filter((existing) => existing._id !== member._id)
        : [...current, member]
    );
  };

  const submitGroup = () => {
    const participantIds = selectedGroupMembers.map((member) => member._id);
    if (groupName.trim().length < 2 || participantIds.length < 2) return;
    createGroupMutation.mutate({
      name: groupName.trim(),
      participantIds
    });
  };

  const openConversation = (conversation) => {
    setActiveConversation(conversation);
    setShowSidebar(false);
  };

  const togglePin = (conversationId) => {
    pinConversationMutation.mutate(conversationId);
  };

  const renderConversationItem = (conversation, options = {}) => {
    const otherParticipant = conversation.participants?.find((participant) => participant._id !== currentUserId);
    const title = getConversationLabel(conversation, currentUserId);
    const avatarLabel = getConversationAvatarLabel(conversation, currentUserId);
    const unread = unreadCount(conversation);
    const preview = getConversationPreview(conversation);
    const active = activeConversation?._id === conversation._id;
    const online = !conversation.isGroup && isUserOnline(otherParticipant);
    const typing = typingPreview(conversation._id);

    return (
      <div
        key={conversation._id}
        role="button"
        tabIndex={0}
        onClick={() => {
          openConversation(conversation);
          options.onClick?.(conversation);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openConversation(conversation);
            options.onClick?.(conversation);
          }
        }}
        className={`group flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-[rgb(var(--bg-elevated))] ${
          active ? 'bg-[rgb(var(--bg-elevated))]' : ''
        }`}
      >
        <div className="relative mt-0.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-white">
            {avatarLabel}
          </div>
          {!conversation.isGroup && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[rgb(var(--bg))] ${
                online ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          )}
          {conversation.isGroup && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white dark:bg-white dark:text-slate-900">
              <FiUsers className="h-2.5 w-2.5" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-slate-950 dark:text-white">{title}</p>
                {conversation.isPinned && <FiStar className="h-3 w-3 text-amber-500" />}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">{conversation.isGroup ? `${conversation.participants?.length || 0} members` : formatLastSeen(otherParticipant?.lastActiveAt)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {typing && <span className="text-[10px] font-medium text-cyan-500">Typing…</span>}
              {unread > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="truncate text-xs text-slate-500">{preview}</p>
            {conversation.lastMessage?.sentAt && (
              <span className="shrink-0 text-[10px] text-slate-500">{formatTime(conversation.lastMessage.sentAt)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              togglePin(conversation._id);
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[rgb(var(--bg))] hover:text-amber-500"
            title={conversation.isPinned ? 'Unpin chat' : 'Pin chat'}
          >
            <FiStar className={`h-3.5 w-3.5 ${conversation.isPinned ? 'text-amber-500' : ''}`} />
          </button>
        </div>
      </div>
    );
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;
    sendMutation.mutate({ conversationId: activeConversation._id, content: messageInput.trim() });
    setMessageInput('');
    const channel = convChannelRef.current;
    if (channel) {
      channel.trigger('client-chat:typing', { isTyping: false });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const invalidateMessages = useCallback(
    (conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    [queryClient]
  );

  useEffect(() => {
    const pusher = getSocket();
    if (!pusher || !user?.id) return;

    const userId = user.id;

    const currentUserChannel = pusher.subscribe(`${CHANNEL_PREFIX}user-${userId}`);
    userChannelRef.current = currentUserChannel;

    currentUserChannel.bind('chat:new', ({ conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (conversationId === activeConversation?._id) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
    });

    return () => {
      if (currentUserChannel) {
        currentUserChannel.unbind('chat:new');
        pusher.unsubscribe(`${CHANNEL_PREFIX}user-${userId}`);
      }
    };
  }, [user?.id, activeConversation?._id, queryClient]);

  // Subscribe/unsubscribe to conversation channel
  useEffect(() => {
    const pusher = getSocket();
    if (!pusher || !activeConversation?._id) return;

    const convId = activeConversation._id;
    const channelName = `${CHANNEL_PREFIX}conversation-${convId}`;
    const channel = pusher.subscribe(channelName);
    convChannelRef.current = channel;

    channel.bind('chat:message', (msg) => {
      if (msg.conversation === convId) {
        invalidateMessages(convId);
        if (msg.sender?._id !== user?.id) {
          chatApi.markAsDelivered(convId);
        }
      }
    });

    channel.bind('chat:messageDeleted', ({ conversationId }) => {
      invalidateMessages(conversationId);
    });

    channel.bind('chat:read', () => {
      invalidateMessages(convId);
    });

    channel.bind('chat:delivered', () => {
      invalidateMessages(convId);
    });

    channel.bind('chat:messageUnsent', ({ conversationId }) => {
      invalidateMessages(conversationId);
    });

    // Mark as read when conversation opens
    chatApi.markAsRead(convId);

    return () => {
      channel.unbind('chat:message');
      channel.unbind('chat:messageDeleted');
      channel.unbind('chat:read');
      channel.unbind('chat:delivered');
      channel.unbind('chat:messageUnsent');
      pusher.unsubscribe(channelName);
      convChannelRef.current = null;
    };
  }, [activeConversation?._id, user?.id, invalidateMessages]);

  useEffect(() => {
    const pusher = getSocket();
    if (!pusher || !user?.id || conversationsView.length === 0) return undefined;

    const subscriptions = conversationsView.map((conversation) => {
      const channelName = `${CHANNEL_PREFIX}conversation-${conversation._id}`;
      const channel = pusher.subscribe(channelName);

      const handleTyping = ({ userId: typingUserId, isTyping }) => {
        if (typingUserId === user?.id) return;
        const typingUser = conversation.participants?.find((participant) => participant._id === typingUserId);
        setConversationTyping((prev) => {
          const next = { ...prev };
          if (isTyping) {
            next[conversation._id] = {
              userId: typingUserId,
              userName: typingUser?.name || 'Someone'
            };
            window.setTimeout(() => {
              setConversationTyping((current) => {
                if (current[conversation._id]?.userId !== typingUserId) return current;
                const updated = { ...current };
                delete updated[conversation._id];
                return updated;
              });
            }, 3000);
          } else if (next[conversation._id]?.userId === typingUserId) {
            delete next[conversation._id];
          }
          return next;
        });
      };

      channel.bind('client-chat:typing', handleTyping);

      return { channelName, channel, handleTyping };
    });

    return () => {
      subscriptions.forEach(({ channelName, channel, handleTyping }) => {
        channel.unbind('client-chat:typing', handleTyping);
        pusher.unsubscribe(channelName);
      });
    };
  }, [conversationsView, user?.id]);

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    const channel = convChannelRef.current;
    if (channel) {
      channel.trigger('client-chat:typing', {
        userId: user?.id,
        isTyping: e.target.value.length > 0
      });
    }
  };

  const getOtherUser = (conversation) => {
    const others = conversation.participants?.filter(
      (p) => p._id !== user?.id
    );
    return others?.[0] || conversation.participants?.[0];
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
      <div className={`${showSidebar ? 'flex' : 'hidden'} w-full flex-col border-r border-[rgb(var(--border))] md:flex md:w-96`}>
        <div className="border-b border-[rgb(var(--border))] p-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-3 py-2">
              <FiSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Search name, username, email, or role..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowGroupModal(true)}
              className="secondary-button shrink-0 px-3 py-2 text-sm"
              title="Create group"
            >
              <FiUsers />
            </button>
            <button
              type="button"
              onClick={() => setShowPrivacyPanel(true)}
              className="secondary-button shrink-0 px-3 py-2 text-sm"
              title="Privacy and permissions"
            >
              <FiLock />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {directoryFilters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setDirectoryFilter(item.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  directoryFilter === item.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-[rgb(var(--bg-elevated))] text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3 p-3">
            <section>
              <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <FiFilter className="h-3.5 w-3.5" />
                User Directory
              </div>
              {directoryLoading ? (
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-4 py-6 text-center text-sm text-slate-500">
                  Loading users...
                </div>
              ) : directoryUsers.length === 0 ? (
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-4 py-6 text-center text-sm text-slate-500">
                  No users match this filter.
                </div>
              ) : (
                <div className="space-y-2">
                  {directoryUsers.map((entry) => renderDirectoryCard(entry))}
                </div>
              )}
            </section>

            {convsLoading ? (
              <div className="flex items-center justify-center p-8 text-sm text-slate-500">Loading chats...</div>
            ) : conversationsView.length === 0 ? null : (
              <>
                {sectionedConversations.pinned.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <FiStar className="text-amber-500" />
                      Pinned Chats
                    </div>
                    <div className="space-y-1">
                      {sectionedConversations.pinned.map((conversation) => renderConversationItem(conversation))}
                    </div>
                  </section>
                )}

                {sectionedConversations.recent.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Recent Chats
                    </div>
                    <div className="space-y-1">
                      {sectionedConversations.recent.map((conversation) => renderConversationItem(conversation))}
                    </div>
                  </section>
                )}

                {sectionedConversations.groups.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <FiHash className="text-cyan-500" />
                      Groups
                    </div>
                    <div className="space-y-1">
                      {sectionedConversations.groups.map((conversation) => renderConversationItem(conversation))}
                    </div>
                  </section>
                )}

                {sectionedConversations.unread.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Unread Chats
                    </div>
                    <div className="space-y-1">
                      {sectionedConversations.unread.map((conversation) => renderConversationItem(conversation))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`${showSidebar ? 'hidden' : 'flex'} flex flex-1 flex-col md:flex`}>
        {activeConversation ? (
          <>
            {(() => {
              const activeTitle = getConversationLabel(activeConversation, currentUserId);
              const activeAvatar = getConversationAvatarLabel(activeConversation, currentUserId);
              const activeParticipant = activeConversation.participants?.find((participant) => participant._id !== currentUserId);
              return (
            <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] p-4">
              <button
                className="md:hidden"
                onClick={() => setShowSidebar(true)}
              >
                <FiChevronLeft />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-white">
                {activeAvatar}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {activeTitle}
                </p>
                {activeConversation.isGroup ? (
                  <p className="text-xs text-slate-500">
                    {activeConversation.participants?.length || 0} members · Group chat
                  </p>
                ) : activeParticipant?.title ? (
                  <p className="text-xs text-slate-500">{activeParticipant.title}</p>
                ) : (
                  <p className="text-xs text-slate-500">{formatLastSeen(activeParticipant?.lastActiveAt)}</p>
                )}
              </div>
            </div>
              );
            })()}

            <div className="flex-1 space-y-1 overflow-y-auto p-4">
              {msgsLoading ? (
                <div className="flex items-center justify-center pt-8 text-sm text-slate-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center pt-8 text-sm text-slate-500">No messages yet. Say hello!</div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender?._id === user?.id;
                  return (
                    <div key={msg._id} className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`relative max-w-[75%] rounded-2xl px-4 py-2 ${
                          isMine
                            ? 'rounded-br-md bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                            : 'rounded-bl-md bg-[rgb(var(--bg-elevated))]'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div className={`mt-1 flex items-center justify-end gap-1 ${isMine ? '' : 'hidden'}`}>
                          <span className="text-[10px] text-white/70">{formatTime(msg.createdAt)}</span>
                          {msg.readBy?.length > 1 ? (
                            <FiCheckCircle className="h-3 w-3 text-blue-300" />
                          ) : msg.deliveredTo?.length > 1 ? (
                            <FiCheckCircle className="h-3 w-3 text-white/70" />
                          ) : (
                            <FiCheck className="h-3 w-3 text-white/70" />
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to unsend this message?')) {
                                unsendMsgMutation.mutate(msg._id);
                              }
                            }}
                            className="hidden text-[10px] text-red-400 group-hover:inline"
                          >
                            <FiXCircle className="h-3 w-3" />
                          </button>
                        </div>
                        {!isMine && (
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500">{formatTime(msg.createdAt)}</span>
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this message?')) {
                                  deleteMsgMutation.mutate(msg._id);
                                }
                              }}
                              className="ml-2 hidden text-[10px] text-red-400 group-hover:inline"
                            >
                              <FiTrash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {conversationTyping[activeConversation._id] && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-[rgb(var(--border))] p-4">
              <input
                type="text"
                value={messageInput}
                onChange={handleTyping}
                placeholder="Write a message..."
                className="input-shell flex-1"
                maxLength={5000}
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="primary-button p-3 disabled:opacity-50"
              >
                <FiSend />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--bg-elevated))]">
                <FiPlus className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Select a conversation or search for a user to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {showPrivacyPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label w-fit">Privacy</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Chat permissions and privacy</h3>
              </div>
              <button type="button" onClick={() => setShowPrivacyPanel(false)} className="secondary-button px-3 py-2">
                <FiX />
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <section className="space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-950 dark:text-white">Messaging privacy</h4>
                  <p className="mt-1 text-xs text-slate-500">Control who can start a conversation with you.</p>
                </div>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Who can message me?</span>
                  <select
                    className="input-shell w-full"
                    value={contactForm?.whoCanMessageMe || 'everyone'}
                    onChange={(e) => setContactForm((current) => ({ ...(current || {}), whoCanMessageMe: e.target.value }))}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="registered-users">Only Registered Users</option>
                    <option value="contacts">Only Friends/Contacts</option>
                    <option value="following">Only Users I Follow</option>
                    <option value="same-role">Only Users with the Same Role</option>
                    <option value="specific-users">Specific Users</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </label>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Who can add me to groups?</span>
                  <select
                    className="input-shell w-full"
                    value={contactForm?.whoCanAddMeToGroups || 'everyone'}
                    onChange={(e) => setContactForm((current) => ({ ...(current || {}), whoCanAddMeToGroups: e.target.value }))}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">Contacts</option>
                    <option value="following">Users I Follow</option>
                    <option value="same-role">Same Role</option>
                    <option value="specific-users">Specific Users</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm">
                  <span>Allow contact requests</span>
                  <input
                    type="checkbox"
                    checked={Boolean(contactForm?.allowContactRequests)}
                    onChange={(e) => setContactForm((current) => ({ ...(current || {}), allowContactRequests: e.target.checked }))}
                  />
                </label>
                <button type="button" onClick={handleSaveContactPermission} className="primary-button w-full">
                  Save messaging permissions
                </button>
              </section>

              <section className="space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-950 dark:text-white">Privacy settings</h4>
                  <p className="mt-1 text-xs text-slate-500">Choose who can view your status and profile details.</p>
                </div>
                {[
                  ['whoCanSeeOnlineStatus', 'Who can see my online status?', 'everyone'],
                  ['whoCanSeeLastSeen', 'Who can see my last seen?', 'everyone'],
                  ['whoCanSeeProfilePicture', 'Who can see my profile picture?', 'everyone'],
                  ['whoCanSeePhoneNumber', 'Who can see my phone number?', 'contacts'],
                  ['whoCanSeeEmail', 'Who can see my email?', 'contacts'],
                  ['whoCanMentionMe', 'Who can mention me?', 'everyone'],
                  ['whoCanForwardMyMessages', 'Who can forward my messages?', 'contacts']
                ].map(([field, label, fallback]) => (
                  <label key={field} className="block space-y-2 text-sm">
                    <span className="font-medium">{label}</span>
                    <select
                      className="input-shell w-full"
                      value={privacyForm?.[field] || fallback}
                      onChange={(e) => setPrivacyForm((current) => ({ ...(current || {}), [field]: e.target.value }))}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">Contacts</option>
                      <option value="specific-users">Specific Users</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </label>
                ))}
                <button type="button" onClick={handleSavePrivacy} className="primary-button w-full">
                  Save privacy settings
                </button>
              </section>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-950 dark:text-white">Blocked users</h4>
                    <p className="mt-1 text-xs text-slate-500">No messages or calls will be allowed.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {blockedUsers.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[rgb(var(--border))] px-4 py-4 text-sm text-slate-500">
                      No blocked users yet.
                    </p>
                  ) : (
                    blockedUsers.map((entry) => (
                      <div key={entry._id} className="flex items-center justify-between rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-950 dark:text-white">{entry.blockedUser?.name || 'Unknown user'}</p>
                          <p className="text-xs text-slate-500">@{entry.blockedUser?.username || entry.blockedUser?.email?.split('@')[0]}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => unblockUserMutation.mutate(entry.blockedUser?._id || entry.blockedUser)}
                          className="secondary-button px-3 py-1.5 text-xs text-red-500"
                        >
                          Unblock
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-950 dark:text-white">Contact requests</h4>
                  <p className="mt-1 text-xs text-slate-500">Accept, reject, or block requesters.</p>
                </div>
                <div className="space-y-2">
                  {contactRequests.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[rgb(var(--border))] px-4 py-4 text-sm text-slate-500">
                      No contact requests.
                    </p>
                  ) : (
                    contactRequests.map((request) => {
                      const sender = request.sender?._id === currentUserId ? request.recipient : request.sender;
                      return (
                        <div key={request._id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-slate-950 dark:text-white">
                                {request.sender?.name || 'User'} → {request.recipient?.name || 'User'}
                              </p>
                              <p className="text-xs text-slate-500">{request.status}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {request.status === 'pending' && request.recipient?._id === currentUserId && (
                                <>
                                  <button type="button" onClick={() => respondContactRequestMutation.mutate({ requestId: request._id, action: 'accepted' })} className="primary-button px-3 py-1.5 text-xs">
                                    Accept
                                  </button>
                                  <button type="button" onClick={() => respondContactRequestMutation.mutate({ requestId: request._id, action: 'rejected' })} className="secondary-button px-3 py-1.5 text-xs">
                                    Reject
                                  </button>
                                  <button type="button" onClick={() => respondContactRequestMutation.mutate({ requestId: request._id, action: 'blocked' })} className="secondary-button px-3 py-1.5 text-xs text-red-500">
                                    Block
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {request.message && <p className="mt-2 text-xs text-slate-500">{request.message}</p>}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-xl rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label w-fit">Chat</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Create group chat</h3>
              </div>
              <button type="button" onClick={() => setShowGroupModal(false)} className="secondary-button px-3 py-2">
                <FiX />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Group name</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Weekend planning"
                  className="input-shell w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Find members</label>
                <input
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  placeholder="Search by name or email"
                  className="input-shell w-full"
                />
              </div>

              <div className="max-h-56 overflow-y-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-2">
                {groupSearchQuery.length >= 2 && groupSearchData?.data?.data?.length ? (
                  groupSearchData.data.data
                    .filter((member) => member._id !== currentUserId && !selectedGroupMembers.some((existing) => existing._id === member._id))
                    .map((member) => (
                      <button
                        key={member._id}
                        type="button"
                        onClick={() => toggleGroupMember(member)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-[rgb(var(--bg))]"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-white">
                          {member.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-950 dark:text-white">{member.name}</p>
                          <p className="truncate text-xs text-slate-500">{member.email}</p>
                        </div>
                        <FiPlus className="text-slate-400" />
                      </button>
                    ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-slate-500">
                    Search for people to add them to the group.
                  </div>
                )}
              </div>

              {selectedGroupMembers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedGroupMembers.map((member) => (
                    <button
                      key={member._id}
                      type="button"
                      onClick={() => toggleGroupMember(member)}
                      className="flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-500"
                    >
                      {member.name}
                      <FiX className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowGroupModal(false)} className="secondary-button">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitGroup}
                  disabled={createGroupMutation.isPending || groupName.trim().length < 2 || selectedGroupMembers.length < 2}
                  className="primary-button disabled:opacity-50"
                >
                  {createGroupMutation.isPending ? 'Creating...' : 'Create group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
