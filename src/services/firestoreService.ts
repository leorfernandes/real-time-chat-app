import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, serverTimestamp, where, FieldValue, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { ChatMessage } from '../types/chat.types';
import { ChatRoom } from '../types/room.types';
import { updateCurrentUser } from '@firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';

const MESSAGES_COLLECTION = 'messages';

export const saveMessageToFirestore = async (
    roomId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
) => {
    try {
        const messageData = {
            ...message,
            timestamp: serverTimestamp() || Timestamp.fromDate(new Date())
        };

        await addDoc(
            collection(db, 'rooms', roomId, MESSAGES_COLLECTION), 
            messageData
        );
        console.log('Message saved to room:', roomId);
    } catch (error) {
        console.error('Error saving message: ', error);
        throw error;
    }
};

export const subscribeToMessages = (
    roomId: string,
    onMessagesUpdate: (messages: ChatMessage[]) => void
) => {    
    const q = query(
        collection(db, 'rooms', roomId, MESSAGES_COLLECTION),
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = data.timestamp as Timestamp;

            return {
                id: doc.id,
                ...(doc.data() as Omit<ChatMessage, 'id' | 'timestamp'>),
                timestamp: timestamp?.toDate() || new Date(),
                userName: data.userName
            } as ChatMessage;
        });
    
        onMessagesUpdate(messages);
    });
};

export const deleteMessage = async (roomId: string, messageId: string) => {
    try {
        await deleteDoc(doc(db, 'rooms', roomId, 'messages', messageId));
    } catch (error) {
        console.error('Error deleting message', error);
        throw error;
    }
};

export const editMessage = async (roomId: string, messageId: string, newText: string) => {
    try {
        await updateDoc(doc(db, 'rooms', roomId, 'messages', messageId), {
            text: newText,
            edited: true,
            editedAt: serverTimestamp() || Timestamp.fromDate(new Date())
        });
    } catch (error) {
        console.error('Error editing message:', error);
        throw error;
    }
};

export const createRoom = async (roomData: Omit<ChatRoom, 'id' | 'createdAt'>) => {
    try {
        const roomRef = await addDoc(collection(db, 'rooms'), {
            ...roomData,
            createdAt: serverTimestamp() || Timestamp.fromDate(new Date())
        });
        return roomRef.id;
    } catch (error) {
        console.error('Error creating room: ', error);
        throw error;
    }
};

export const subscribeToRooms = (onRoomsUpdate: (rooms: ChatRoom[]) => void) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.warn('No authenticated user found');
        onRoomsUpdate([]);
        return () => {};
    }

    try {
        const q = query(
            collection(db, 'rooms'),
            where('participants', 'array-contains', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, 
            (snapshot) => {
                const rooms = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const timestamp = data.createdAt as Timestamp;

                    return {
                        id: doc.id,
                        ...data,
                        createdAt: timestamp?.toDate() || new Date(),
                    } as ChatRoom;
                });
                onRoomsUpdate(rooms);
            },
            (error) => {
                console.error('Error subscribing to rooms: ', error);
                onRoomsUpdate([]);
            }
        );
    } catch (error) {
        console.error('Error subscribing to rooms subscriptions:', error);
        onRoomsUpdate([]);
        return () => {};
    }
};


export const toggleReaction = async (
    roomId: string,
    messageId: string,
    emoji: string,
    userId: string,
    userName: string
) => {
    try {
        const messageRef = doc(db, 'rooms', roomId, 'messages', messageId);
        const messageDoc = await getDoc(messageRef);

        if (!messageDoc.exists()) return;

        const reactions = messageDoc.data().reactions || {};
        const emojiReactions = reactions[emoji] || [];

        type Reaction = { 
            userId: string; 
            emoji: string; 
            userName: string; 
            timestamp: Date 
            };
        const existingReaction = emojiReactions.findIndex((r: Reaction) => r.userId === userId);

        if (existingReaction >= 0) {
            emojiReactions.splice(existingReaction, 1);
        } else {
            emojiReactions.push({
                emoji,
                userId,
                userName,
                timestamp: new Date()
            });
        }

        if (emojiReactions.length > 0) {
            reactions[emoji] = emojiReactions;
        } else {
            delete reactions[emoji];
        }

        await updateDoc(messageRef, { reactions });
    } catch (error) {
        console.error('Error toggling reaction:', error);
        throw error;
    }
};
