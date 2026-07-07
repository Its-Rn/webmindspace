import Pusher from 'pusher-js';

let pusherInstance = null;

const getPusherKey = () => {
  // The Pusher key is safe to expose publicly
  return import.meta.env.VITE_PUSHER_KEY || '';
};

const getPusherCluster = () => {
  return import.meta.env.VITE_PUSHER_CLUSTER || 'mt1';
};

const getAuthEndpoint = () => {
  return import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/chat/pusher/auth`
    : '/api/v1/chat/pusher/auth';
};

export const getSocket = () => {
  const key = getPusherKey();
  if (!key) return null;

  if (!pusherInstance) {
    pusherInstance = new Pusher(key, {
      cluster: getPusherCluster(),
      channelAuthorization: {
        endpoint: getAuthEndpoint(),
        transport: 'ajax'
      },
      forceTLS: true
    });
  }
  return pusherInstance;
};

export const disconnectSocket = () => {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
};
