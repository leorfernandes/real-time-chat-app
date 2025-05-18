import React, { useState, useEffect } from 'react';
import { 
    View, 
    TextInput, 
    Button, 
    StyleSheet, 
    Alert, 
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Text,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/ParamList';
import { getUserProfile, updateUserProfile, uploadAvatar } from '../services/profileService'
import { auth } from '../firebaseConfig';
import { logOut } from '../services/authService';
import { UserProfile } from '../types/profile.types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const STATUS_OPTIONS = ['online', 'away', 'busy', 'offline'] as const;
type Status = typeof STATUS_OPTIONS[number];

const ProfileScreen = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [status, setStatus] = useState<Status>('online');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<ProfileScreenNavigationProp>();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No authenticated user');

            const userProfile = await getUserProfile(userId);
            setProfile(userProfile);
            setDisplayName(userProfile.displayName);
            setAvatarUrl(userProfile.photoURL || null);
        } catch (error) {
            console.error('Load profile error:', error);
            Alert.alert(
                'Error', 
                'Failed to load profile. Please try again.',
                [{ text: 'Retry', onPress: loadProfile }]
            );
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission required', 'Please grant permission to access your gallery');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets[0]) {
                setLoading(true);
                try {
                    console.log('Selected image URI:', result.assets[0].uri);

                    const uploadedUrl = await uploadAvatar(result.assets[0].uri);
                    console.log('Upload successful, URL:', uploadedUrl);

                    setAvatarUrl(uploadedUrl);
                    await updateUserProfile({ photoURL: uploadedUrl });
                    Alert.alert('Success', 'Profile photo updated successfully');
                } catch (error) {
                    console.error('Upload error details:', error);
                    Alert.alert('Error', 'Failed to upload avatar');
                } finally {
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to access image picker');
        }
    };

    const handleUpdateProfile = async () => {
        if (!displayName.trim()) return;

        try {
            setLoading(true);
            await updateUserProfile({ 
                displayName: displayName.trim(),
                photoURL: avatarUrl || undefined, 
            });
            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } catch (error) {
            console.log('Update profile error:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size='large' color='#007AFF' />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
                    </View>
                )}
            </TouchableOpacity>

            <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder='Display Name'
            />

            <View style={styles.statusContainer}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusOptions}>
                    {STATUS_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.statusOption,
                                status === option && styles.statusOptionSelected                            
                            ]}
                        onPress={() => setStatus(option)}
                    >
                            <Text
                                style={[
                                    styles.statusText,
                                    status === option && styles.statusTextSelected
                                ]}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    </View>
                </View>

            <Button
                title='Update Profile'
                onPress={handleUpdateProfile}
                disabled={!displayName.trim()}
            />

            <View style={styles.logoutContainer}>
                    <Button
                        title='Log Out'
                        onPress={async () => {
                            try {
                                await logOut();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                });
                            } catch (error) {
                                console.error('Logout error:', error);
                                Alert.alert('Error', 'Failed to log out. Please try again.');
                            }
                        }}
                        color="#FF3B30"
                    />
                </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginBottom: 16,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e1e1e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        color: '#666',
        fontSize: 14,
    },
    statusContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    statusOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusOption: {
        padding: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    statusOptionSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    statusText: {
        color: '#666',
    },
    statusTextSelected: {
        color: '#fff',
    },
    logoutContainer: {
        marginTop: 32,
        paddingHorizontal: 16,
    },
});

export default ProfileScreen;