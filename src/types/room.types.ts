export interface ChatRoom {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
    createdAt: Date;
    lastMessage?: {
        text: string;
        timestamp: Date;
    };
    participants: string[];
}