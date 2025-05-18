import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebaseConfig';
import { UserProfile } from '../types/profile.types';

export const createUserProfile = async (userData: Omit<UserProfile, 'id'>) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    try {
        await setDoc(doc(db, 'users', user.uid), {
            ...userData,
            id: user.uid,
        });
    } catch (error) {
        console.error('Error creating user profile: ', error);
        throw error;
    }
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Create default profie if it doesn't exist;
            const defaultProfile: UserProfile = {
                id: userId,
                displayName: 'User',
                email: auth.currentUser?.email || '',
                status: 'online'
            };

            await setDoc(docRef, defaultProfile);
            return defaultProfile;
        }

    return docSnap.data() as UserProfile;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw new Error('Failed to load profile');
    }
};

export const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    try {
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, updates);
        console.log('Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error);
        throw new Error('Failed to update profile');
    }
};

export const uploadAvatar = async (uri: string): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    try {
        // First convert URI to base64
        const response = await fetch(uri);
        if (!response.ok) throw new Error('Failed to fetch image');

        const blob = await response.blob();
        if (!blob) throw new Error('Failed to create blob from image');

        // Create storage reference
        const fileName = `avatar_${user.uid}_${Date.now()}.jpg`;
        const storageRef = ref(storage, `avatars/${user.uid}/${fileName}`);

        // Simplified metadata
        const metadata = {
            contentType: 'image/jpeg'
        };

        // Log upload attempt
        console.log('Starting upload...', {
            userId: user.uid,
            fileName,
            size: blob.size,
            type: blob.type
        });

        // Upload with explicit content type
        const uploadResult = await uploadBytes(storageRef, blob, metadata);
        if (!uploadResult) throw new Error('Upload failed - no result returned');

        console.log('Upload successful, getting URL...');

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        if (!downloadURL) throw new Error('Failed to get download URL');

        console.log('Upload complete with URL:', downloadURL);
        return downloadURL;

    } catch (error) {
        console.error('Upload failed:', error);
        if (error instanceof Error) {
            throw new Error(`Avatar upload failed: ${error.message}`);
        }
        throw new Error('Avatar upload failed with unknown error');
    }
};