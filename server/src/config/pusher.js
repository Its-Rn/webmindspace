import Pusher from 'pusher';
import { appEnv } from './env.js';

let pusherInstance = null;

export const getPusher = () => {
  if (!pusherInstance) {
    if (!appEnv.pusherAppId || !appEnv.pusherKey || !appEnv.pusherSecret) {
      return null;
    }
    pusherInstance = new Pusher({
      appId: appEnv.pusherAppId,
      key: appEnv.pusherKey,
      secret: appEnv.pusherSecret,
      cluster: appEnv.pusherCluster,
      useTLS: true
    });
  }
  return pusherInstance;
};

export const triggerEvent = (channel, event, data) => {
  const pusher = getPusher();
  if (!pusher) return;
  try {
    pusher.trigger(channel, event, data);
  } catch {
    // silently fail
  }
};
