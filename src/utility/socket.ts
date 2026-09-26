import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';

class SocketService {
  private static instance: SocketService;
  public socket: Socket;

  private constructor() {
    this.socket = io(URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }
}

export const socket = SocketService.getInstance().socket;
