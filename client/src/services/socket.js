import { io } from 'socket.io-client';

let socketInstance = null;
const channelBindings = new Map();

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (import.meta.env.VITE_API_BASE_URL && /^https?:\/\//i.test(import.meta.env.VITE_API_BASE_URL)) {
    try {
      return new URL(import.meta.env.VITE_API_BASE_URL).origin;
    } catch {
      return import.meta.env.VITE_API_BASE_URL;
    }
  }
  if (import.meta.env.DEV) return 'http://localhost:5000';
  return undefined;
};

const getSocketOptions = () => ({
  withCredentials: true,
  transports: ['websocket', 'polling'],
  auth: { token: getCookie('ppp_access_token') },
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

const buildChannel = (socket, channelName) => ({
  bind(eventName, handler) {
    const id = `${channelName}:${eventName}:${handler}`;
    socket.on(eventName, handler);
    channelBindings.set(id, { eventName, handler });
  },
  unbind(eventName, handler) {
    const id = `${channelName}:${eventName}:${handler}`;
    socket.off(eventName, handler);
    channelBindings.delete(id);
  },
  trigger(eventName, payload) {
    socket.emit('client-event', { channelName, eventName, payload });
  }
});

export const getSocket = () => {
  if (socketInstance && socketInstance.connected) {
    const token = getCookie('ppp_access_token');
    if (token && socketInstance.auth) {
      socketInstance.auth.token = token;
    }
    return socketInstance;
  }

  if (socketInstance) {
    const token = getCookie('ppp_access_token');
    if (token && socketInstance.auth) {
      socketInstance.auth.token = token;
    }
    socketInstance.connect();
    return socketInstance;
  }

  const socket = io(getSocketUrl(), getSocketOptions());

  socket.on('connect', () => {
    const token = getCookie('ppp_access_token');
    if (token && socket.auth) {
      socket.auth.token = token;
    }
  });

  socket.on('reconnect_attempt', () => {
    const token = getCookie('ppp_access_token');
    if (token && socket.auth) {
      socket.auth.token = token;
    }
  });

  socket.subscribe = (channelName) => {
    socket.emit('subscribe', { channelName });
    return buildChannel(socket, channelName);
  };

  socket.unsubscribe = (channelName) => {
    socket.emit('unsubscribe', { channelName });
  };

  socketInstance = socket;
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    for (const { eventName, handler } of channelBindings.values()) {
      socketInstance.off(eventName, handler);
    }
    channelBindings.clear();
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export const refreshSocketToken = () => {
  const token = getCookie('ppp_access_token');
  if (socketInstance && token) {
    socketInstance.auth.token = token;
  }
};