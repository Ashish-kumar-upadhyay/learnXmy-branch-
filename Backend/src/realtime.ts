import { Server } from 'socket.io';

let io: Server | null = null;

export function setRealtimeServer(server: Server) {
  io = server;
}

export function notifyUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}
