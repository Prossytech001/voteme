import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');

// Singleton socket — created once, shared across every component that needs live updates.
export const socket = io(SOCKET_URL, { autoConnect: true, reconnection: true });
