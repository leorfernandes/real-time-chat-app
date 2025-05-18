import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';

const EMOJI_LIST = ['😀', '😂', '😍', '😢', '😡', '👍', '👎', '🎉', '🔥', '💔',];

interface ReactionPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelectReaction: (emoji: string) => void;
}

export const ReactionPicker = ({ visible, onClose, onSelectReaction }: ReactionPickerProps) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType='fade'
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.container}>
                    {EMOJI_LIST.map((emoji) => (
                        <TouchableOpacity
                            key={emoji}
                            style={styles.emojiButton}
                            onPress={() => {
                                onSelectReaction(emoji);
                                onClose();
                            }}
                        >
                            <Text style={styles.emoji}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 8,
        flexDirection: 'row',
        maxWidth: '80%',
    },
    emojiButton: {
        padding: 8,
    },
    emoji: {
        fontSize: 24,
    },
});