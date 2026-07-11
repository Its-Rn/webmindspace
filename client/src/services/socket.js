import { io } from 'socket.io-client';

let socketInstance = null;
const channelBindings = new Map();

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
  transports: ['websocket', 'polling']
});

const getChannelKey = (channelName, eventName) => `${channelName}:${eventName}`;

const buildChannel = (socket, channelName) => ({
  bind(eventName, handler) {
    const key = getChannelKey(channelName, eventName);
    socket.on(key, handler);
    channelBindings.set(`${key}:${handler}`, { key, handler });
  },
  unbind(eventName, handler) {
    const key = getChannelKey(channelName, eventName);
    socket.off(key, handler);
    channelBindings.delete(`${key}:${handler}`);
  },
  trigger(eventName, payload) {
    socket.emit('client-event', { channelName, eventName, payload });
  }
});

export const getSocket = () => {
  if (socketInstance) return socketInstance;

  const socket = io(getSocketUrl(), getSocketOptions());

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
    for (const { key, handler } of channelBindings.values()) {
      socketInstance.off(key, handler);
    }
    channelBindings.clear();
    socketInstance.disconnect();
    socketInstance = null;
  }
};
