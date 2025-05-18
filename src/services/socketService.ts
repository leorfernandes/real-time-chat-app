import { io, Socket } from 'socket.io-client';

interface Message {
    id: string;
    text: string;
    userId: string;
    timestamp: Date;
}

class SocketService {
    private socket: Socket | null = null;
    private static instance: SocketService;
    private userId: string | null = null;

    private constructor() {}

    static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    connect(userId: string) {
        this.userId = userId;
        this.socket = io(process.env.SOCKET_SERVER_URL , {
            query: { userId },
            transports: ['websocket'],
            timeout: 10000,
        });

        this.socket.on('connect', () => {
            console.log ('Connected to Socket.IO server'); // Debugging
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            console.log('Disconnected from Socket.IO server'); // Debugging
        }
    }

    sendMessage(message: { text: string; userId: string }) {
        if (this.socket) {
            const messageWithId = {
                ...message,
                id: `${Date.now()}-${Math.random().toString(36).substr(2,9)}`
            };
            this.socket.emit('message', message);
            console.log('Message sent:', message); // Debugging
        }
    }

    onMessage(callback: (message: any) => void) {
        if (this.socket) {
            this.socket.on('message', (message: any) => {
                const messageWithDate ={
                    ...message,
                    timestamp: new Date(message.timestamp)
                };
                callback(messageWithDate);
                console.log('Listening for messages'); // Debugging
            });
        }
    }

    emitTyping(isTyping: boolean) {
        if (this.socket) {
            this.socket.emit('typing', {
                userId: this.userId,
                isTyping,
            });
            console.log('Typing status emitted:', isTyping); // Debugging
        }
    }

    onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
        if (this.socket) {
            this.socket.on('userTyping', callback);
        }
    }
}

export const socketService = SocketService.getInstance();