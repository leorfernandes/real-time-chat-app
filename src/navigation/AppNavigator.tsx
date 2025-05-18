import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './ParamList';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import ChatScreen from '../screens/ChatScreen';
import RoomList from '../screens/RoomListScreen';
import CreateRoomScreen from '../screens/CreateRoomScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name='Login' component={LoginScreen} />
                <Stack.Screen name='SignUp' component={SignUpScreen} />
                <Stack.Screen name='Chat' component={ChatScreen} />
                <Stack.Screen 
                    name='RoomList' 
                    component={RoomList} 
                    options={{ title: 'Chat Rooms' }}
                />
                <Stack.Screen 
                    name='CreateRoom'
                    component={CreateRoomScreen}
                    options={{ title: 'Create New Room' }}
                />
                <Stack.Screen
                    name='Profile'
                    component={ProfileScreen}
                    options={{ title: 'My Profile' }}
                />
                {/* Add other screens as needed */}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;