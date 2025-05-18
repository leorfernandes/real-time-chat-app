import React, {useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { logIn } from '../services/authService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/ParamList';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigation = useNavigation<LoginScreenNavigationProp>();

    const handleLogin = async () => {
        console.log('Login button pressed!'); // Debugging
        try {
            console.log('Calling logIn with:', email, password); // Debugging
            await logIn(email, password);
            alert('User logged in successfully!');
            navigation.navigate('RoomList');
        } catch (err: any) {
            console.error("Login error:", err.message); // Debugging
            setError(err.message);
        }
    };

    const goToSignUp = () => {
        navigation.navigate('SignUp');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput
                style={styles.input}
                placeholder='Email'
                value={email}
                onChangeText={setEmail}
                keyboardType='email-address'
                autoCapitalize='none'
            />
            <TextInput
                style={styles.input}
                placeholder='Password'
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title='Login' onPress={handleLogin} />
            <Button title='SignUp' onPress={goToSignUp} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginBottom: 16,
        borderRadius: 4,
    },
    error: {
        color: 'red',
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        marginTop: 16,
    },
});

export default LoginScreen;