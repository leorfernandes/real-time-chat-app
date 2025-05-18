import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageReaction } from '../types/chat.types';

interface MessageReactionsProps {
    reactions: Record<string, MessageReaction[]>;
    onPressReaction: (emoji: string) => void;
    currentUserId: string;
}

export const MessageReactions = ({
    reactions,
    onPressReaction,
    currentUserId
}: MessageReactionsProps) => {
    return (
        <View style={styles.container}>
            {Object.entries(reactions).map(([emoji, users]) => (
                <TouchableOpacity
                    key={emoji}
                    style={[
                        styles.reactionButton,
                        users.some(u => u.userId === currentUserId) && styles.activeReaction
                    ]}
                    onPress={() => onPressReaction(emoji)}
                >
                    <Text style={styles.emoji}>{emoji}</Text>
                    <Text style={styles.count}>{users.length}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    reactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 4,
        marginBottom: 4,
    },
    activeReaction: {
        backgroundColor: '#e3f2fd',
    },
    emoji: {
        fontSize: 14,
        marginRight: 4,
    },
    count: {
        fontSize: 12,
        color: '#666',
    },
});