import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ChatRoom } from '../types/room.types';

export const getRoomById = async (roomId: string): Promise<ChatRoom> => {
    try {
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));

        if (!roomDoc.exists()) {
            throw new Error('Room not found');
        }

        const roomData = roomDoc.data();
        return {
            id: roomDoc.id,
            ...roomData,
            createdAt: roomData.createdAt?.toDate() || new Date(),
            lastMessage: roomData.lastMessage ? {
                ...roomData.lastMessage,
                timestamp: roomData.lastMessage.timestamp?.toDate() || new Date()
            } : undefined
        } as ChatRoom;
    } catch (error) {
        console.error('Errorr fetching room:', error);
        throw new Error('Failed to fetch room details');
    }
};