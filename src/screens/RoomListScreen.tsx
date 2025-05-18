import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/ParamList';
import { subscribeToRooms } from '../services/firestoreService';
import { ChatRoom } from '../types/room.types';
import { formatMessageTimestamp } from '../utils/dateFormatters';

type RoomListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RoomList'>;

const RoomListScreen = () => {
    const [ rooms, setRooms] = useState<ChatRoom[]>([]);
    const navigation = useNavigation<RoomListScreenNavigationProp>();

    useEffect(() => {
        const unsubscribe = subscribeToRooms((updatedRooms) => {
            setRooms(updatedRooms);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Button
                    title='Profile'
                    onPress={() => navigation.navigate('Profile')}
                />
            ),
        });
    }, [navigation]);
    
    const renderRoom = ({ item }: { item: ChatRoom }) => (
        <TouchableOpacity
            style={styles.roomItem}
            onPress={() => navigation.navigate('Chat', { roomId: item.id })}
        >
            <View style={styles.roomInfo}>
                <Text style={styles.roomName}>{item.name}</Text>
                {item.description && (
                    <Text style={styles.roomDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                <Text style={styles.participantCount}>
                    {item.participants.length} participants
                </Text>
                {item.lastMessage && (
                    <View style={styles.lastMessageContainer}>
                        <Text style={styles.lastMessageText} numberOfLines={1}>
                            {item.lastMessage.text}
                        </Text>
                        <Text style={styles.lastMessage}>
                            {formatMessageTimestamp(item.lastMessage.timestamp)}
                        </Text>
                    </View>
                )}
            </View>    
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={rooms}
                renderItem={renderRoom}
                keyExtractor={item => item.id}
                style={styles.roomList}
            />
            <TouchableOpacity
                style={styles.createRoomButton}
                onPress={() => navigation.navigate('CreateRoom')}
            >
                    <Text style={styles.createRoomButtonText}>Create Room</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    roomList: {
        flex: 1,
    },
    roomItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    roomName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    createRoomButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        margin: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    createRoomButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    roomInfo: {
        flex: 1,
    },
    participantCount: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    lastMessageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    lastMessageText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        marginRight: 8,
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
    },
    roomDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
        marginBottom: 8,
    },
});

export default RoomListScreen;