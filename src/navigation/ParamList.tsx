export type RootStackParamList = {
    Login: undefined;
    SignUp: undefined;
    Chat: { roomId: string };
    RoomList: undefined;
    CreateRoom: undefined;
    Profile: undefined;
    // Add other screens as needed
};

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}