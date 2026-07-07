import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { FiUser, FiPlus, FiSend, FiSearch, FiChevronLeft, FiTrash2, FiCheck, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { chatApi, getSocket } from '../../services/chat';

const CHANNEL_PREFIX = 'private-';

const ChatPage = () => {
  const outletContext = useOutletContext();
  const user = outletContext?.currentUser || null;
  const queryClient = useQueryClient();
  const [activeConversation, setActiveConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
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

  const { data: searchData } = useQuery({
    queryKey: ['search-users', searchQuery],
    queryFn: () => chatApi.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2
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
      setSearchQuery('');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
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

    channel.bind('client-chat:typing', ({ userId: typingUserId, isTyping }) => {
      if (typingUserId !== user?.id) {
        setTypingUsers((prev) => ({ ...prev, [typingUserId]: isTyping }));
        if (isTyping) {
          setTimeout(() => {
            setTypingUsers((prev) => ({ ...prev, [typingUserId]: false }));
          }, 3000);
        }
      }
    });

    // Mark as read when conversation opens
    chatApi.markAsRead(convId);

    return () => {
      channel.unbind('chat:message');
      channel.unbind('chat:messageDeleted');
      channel.unbind('chat:read');
      channel.unbind('chat:delivered');
      channel.unbind('chat:messageUnsent');
      channel.unbind('client-chat:typing');
      pusher.unsubscribe(channelName);
      convChannelRef.current = null;
    };
  }, [activeConversation?._id, user?.id, invalidateMessages]);

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

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const unreadCount = (conv) => {
    return conv.unreadCounts?.[user?.id] || 0;
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
      <div className={`${showSidebar ? 'flex' : 'hidden'} w-full flex-col border-r border-[rgb(var(--border))] md:flex md:w-80`}>
        <div className="flex items-center gap-2 border-b border-[rgb(var(--border))] p-4">
          <FiSearch className="text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {searchQuery.length >= 2 && searchData?.data?.data ? (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-500">New conversation</p>
              {searchData.data.data.map((u) => (
                <button
                  key={u._id}
                  onClick={() => startConvMutation.mutate(u._id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[rgb(var(--bg-elevated))]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-white">
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              {convsLoading ? (
                <div className="flex items-center justify-center p-8 text-sm text-slate-500">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-sm text-slate-500">No conversations yet. Search a user above to start chatting.</div>
              ) : (
                conversations.map((conv) => {
                  const other = getOtherUser(conv);
                  const unread = unreadCount(conv);
                  return (
                    <button
                      key={conv._id}
                      onClick={() => {
                        setActiveConversation(conv);
                        setShowSidebar(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgb(var(--bg-elevated))] ${
                        activeConversation?._id === conv._id ? 'bg-[rgb(var(--bg-elevated))]' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-white">
                          {other?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        {unread > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-white">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium">{other?.name || 'You'}</p>
                          {conv.lastMessage?.sentAt && (
                            <span className="shrink-0 text-[10px] text-slate-500">{formatTime(conv.lastMessage.sentAt)}</span>
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-500">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>

      <div className={`${showSidebar ? 'hidden' : 'flex'} flex flex-1 flex-col md:flex`}>
        {activeConversation ? (
          <>
            <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] p-4">
              <button
                className="md:hidden"
                onClick={() => setShowSidebar(true)}
              >
                <FiChevronLeft />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-white">
                {getOtherUser(activeConversation)?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {getOtherUser(activeConversation)?.name || 'You'}
                </p>
                {getOtherUser(activeConversation)?.title && (
                  <p className="text-xs text-slate-500">{getOtherUser(activeConversation).title}</p>
                )}
              </div>
            </div>

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
                            onClick={() => unsendMsgMutation.mutate(msg._id)}
                            className="hidden text-[10px] text-red-400 group-hover:inline"
                          >
                            <FiXCircle className="h-3 w-3" />
                          </button>
                        </div>
                        {!isMine && (
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500">{formatTime(msg.createdAt)}</span>
                            <button
                              onClick={() => deleteMsgMutation.mutate(msg._id)}
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
              {Object.values(typingUsers).some(Boolean) && (
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
    </div>
  );
};

export default ChatPage;
