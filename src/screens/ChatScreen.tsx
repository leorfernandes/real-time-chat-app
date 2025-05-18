import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/ParamList';
import { auth } from '../firebaseConfig';
import { socketService } from '../services/socketService';
import { 
    saveMessageToFirestore, 
    subscribeToMessages,
    deleteMessage, 
    editMessage,
    toggleReaction,
    } from '../services/firestoreService';
import { ChatMessage } from '../types/chat.types';
import { formatMessageTimestamp, formatMessageTime } from '../utils/dateFormatters';
import { ReactionPicker } from '../components/ReactionPicker';
import { MessageReactions } from '../components/MessageReactions';
import { getRoomById } from '../services/roomService';

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const ChatScreen = ({ route }: ChatScreenProps) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const navigation = useNavigation<ChatScreenNavigationProp>();
    const [isSending, setIsSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const currentUser = auth.currentUser;
    const { roomId } = route.params;
    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
    const [showReactions, setShowReactions] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);


    useEffect(() => {
        if (currentUser) {
            // Connect to Socket.IO when component mounts
            socketService.connect(currentUser.uid);

            // Listen for incoming messages
            socketService.onMessage((newMessage: ChatMessage) => {
                const messageWithId = {
                    ...newMessage,
                    id: newMessage.id || Date.now().toString()
                };

                setMessages(prevMessages => [...prevMessages, messageWithId]);
            });
            
            socketService.onUserTyping(({ userId, isTyping }) => {
                setTypingUsers(prev => {
                    const updated = new Set(prev);
                    if (isTyping) {
                        updated.add(userId);
                    } else {
                        updated.delete(userId);;
                    }
                    return updated;
                });
            });
        }

        // Cleanup on unmount
        return () => {
            socketService.disconnect();
        };

    }, [currentUser]);

    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages]);

    // Subscribe to Firestore updates
    useEffect(() => {
        const unsubscribe = subscribeToMessages(roomId, (updatedMessages) => {
            setMessages(updatedMessages);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [roomId]);

    const handleTyping = (text: string) => {
        setMessage(text);
        if (!isTyping && text.length > 0) {
            setIsTyping(true);
            socketService.emitTyping(true);
        } else if (isTyping && text.length === 0) {
            setIsTyping(false);
            socketService.emitTyping(false);
        }
    };

    useEffect(() => {
        const loadRoomDetails = async () => {
            try {
                const room = await getRoomById(roomId);
                navigation.setOptions({
                    title: room.name,
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert(
                                    room.name,
                                    room.description || 'No description',
                                    [{ text: 'OK' }]
                                ); 
                            }}
                        >
                            <Text style={styles.headerButton}>Info</Text>
                        </TouchableOpacity>
                    ),
                });
            } catch (error) {
                console.error('Error loading room details:', error);
            }
        };

        loadRoomDetails();
    }, [navigation, roomId]);

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isMyMessage = item.userId === currentUser?.uid;

        return (
            <TouchableOpacity
                onLongPress={() => handleLongPress(item)}
                onPress={() => {
                    setSelectedMessage(item);
                    setShowReactions(true);
                }}
                activeOpacity={0.7}
            >
                <View style={[
                    styles.messageContainer,
                    isMyMessage ? styles.sentMessage : styles.receivedMessage
                ]}>
                    <View style={styles.messageContent}>
                        <Text style={[
                            styles.messageText,
                            isMyMessage ? styles.sentMessageText : styles.receivedMessage
                        ]}>
                            {item.text}
                        </Text>
                        {item.reactions && Object.keys(item.reactions).length > 0 && (
                            <MessageReactions
                                reactions={item.reactions}
                                onPressReaction={(emoji) => handleReactionSelect(emoji)}
                                currentUserId={currentUser?.uid || ''}
                            />
                        )}
                        <View style={styles.messageMetadata}>
                            <Text style={styles.timestamp}>
                                {formatMessageTime(item.timestamp)}
                            </Text>
                            <Text style={styles.relativeTime}>
                                {formatMessageTimestamp(item.timestamp)}
                            </Text>
                            {item.edited && (
                                <Text style={styles.editedTag}>(edited)</Text>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderTypingIndicator = () => {
        const count = typingUsers.size;
        if (count === 0) return null;

        return (
            <Text style={styles.typingIndicator}>
                {count === 1
                    ? 'Someone is typing...'
                    : `${count} people are typing...`}
            </Text>
        )
    }

    const handleLongPress = (message: ChatMessage) => {
        if (message.userId !== currentUser?.uid) return;

        Alert.alert(
            'Message Actions',
            'What would you like to do?',
            [
                 {
                    text: 'Edit',
                    onPress: () => {
                        setEditingMessage(message);
                        setMessage(message.text);
                    }
                 },
                 {
                    text: 'Delete',
                    onPress: () => confirmDelete(message),
                    style: 'destructive'
                 },
                 {
                    text: 'Cancel',
                    style: 'cancel'
                 }
            ]
        );
    };

    const handleReactionSelect = async (emoji: string) => {
        if (!selectedMessage || !currentUser) return;

        try {
            await toggleReaction(
                route.params.roomId,
                selectedMessage.id,
                emoji,
                currentUser.uid,
                currentUser.email || 'Anonymous'
            );
        } catch (error) {
            console.error('Error adding reaction:', error);
            Alert.alert('Error', 'Failed to add reaction');
        }
    };

    const confirmDelete = (message: ChatMessage) => {
        Alert.alert(
            'Delete message',
            'Are you sure you want to delete this message?',
            [
                {
                    text: 'Delete',
                    onPress: () => deleteMessage(route.params.roomId, message.id),
                    style: 'destructive'
                },
                {
                    text: 'Cancel',
                    style:'cancel'
                }
            ]
        );
    };

    const handleSend = async () => {
        if (!message.trim() || !currentUser) return;

        try {
            if (editingMessage) {
                await editMessage(route.params.roomId, editingMessage.id, message.trim());
                setEditingMessage(null);
            } else {
                await saveMessageToFirestore(route.params.roomId, {
                    text: message.trim(),
                    userId: currentUser.uid,
                    userName: currentUser.email || 'Anonymous'
                });
            }
            setMessage('');
        } catch (error) {
            console.error('Error sending/editing message:', error);
            Alert.alert('Error', 'Failed to send/edit message');
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                style={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />
            {renderTypingIndicator()}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={message}
                    onChangeText={setMessage}
                    placeholder={editingMessage? "Edit message..." : "Type a message..."}
                    multiline
                />
                <Button 
                    title={editingMessage ? 'Save' : 'Send'} 
                    onPress={handleSend}
                    disabled={!message.trim()} 
                />
                {editingMessage && (
                    <Button
                        title="Cancel"
                        onPress={() => {
                            setEditingMessage(null);
                            setMessage('');
                        }}
                        color="#999"
                    />
                )}
            </View>
            <ReactionPicker
                visible={showReactions}
                onClose={() => setShowReactions(false)}
                onSelectReaction={handleReactionSelect}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    messagesList: {
        flex: 1,
        padding: 16,
    },
    messageContainer: {
        marginVertical: 4,
        marginHorizontal: 8,
        maxWidth: '80%',
    },
    messageText: {
        fontSize: 16,
    },
    sentMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
    },
    receivedMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F0F0',
    },
    sentMessageText: {
        color: '#fff',
    },
    receivedMessageText: {
        color: '#000',
    },
    timestamp: {
        fontSize: 10,
        color: '#999',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        maxHeight: 100,
    },
    typingIndicator: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    messageContent: {
        borderRadius: 12,
        padding: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    messageMetadata: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
    },
    relativeTime: {
        fontSize: 10,
        color: '#999',
        fontStyle: 'italic',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    editedTag: {
        fontSize: 11,
        color: '#999',
        marginLeft: 4,
        fontStyle: 'italic',
    },
    headerButton: {
        color: '#007AFF',
        fontSize: 16,
        marginRight: 16,
    },
});

export default ChatScreen;