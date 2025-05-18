export interface ChatMessage {
    id: string;
    text: string;
    userId: string;
    timestamp: Date;
    userName?: string;
    edited?: boolean;
    editedAt?: Date;
    reactions?: {
        [key: string]: MessageReaction[];
    }
}

export interface TypingIndicator {
    userId: string;
    isTyping: boolean
}

export interface MessageReaction {
    emoji: string;
    userId: string;
    userName: string;
    timestamp: Date;
}