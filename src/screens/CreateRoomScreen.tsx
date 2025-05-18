import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/ParamList';
import { createRoom } from '../services/firestoreService';
import { auth } from '../firebaseConfig';

type CreateRoomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateRoom'>;

const CreateRoomScreen = () => {
    const [roomName, setRoomName] = useState('');
    const [description, setDescription] = useState('');
    const navigation = useNavigation<CreateRoomScreenNavigationProp>();
    const currentUser = auth.currentUser;

    const handleCreateRoom = async () => {
        if (!roomName.trimEnd() || !currentUser) return;

        try {
            await createRoom({
                name: roomName.trim(),
                description: description.trim(),
                createdBy: currentUser.uid,
                participants: [currentUser.uid],
            });

            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to create room. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                value={roomName}
                onChangeText={setRoomName}
                placeholder='Room Name'
                autoFocus
            />
            <TextInput
                style={[styles.input, styles.descriptionInput]}
                value={description}
                onChangeText={setDescription}
                placeholder='Room Description (optional)'
                multiline
                numberOfLines={3}
            />
            <Button 
                title='Create Room'
                onPress={handleCreateRoom}
                disabled={!roomName.trim()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginBottom: 16,
    },
    descriptionInput: {
        height: 100,
        textAlignVertical: 'top',
    },
});

export default CreateRoomScreen;