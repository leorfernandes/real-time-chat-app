export interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    status: 'online' | 'away' | 'busy'| 'offline' ;
    lastSeen?: Date;
}