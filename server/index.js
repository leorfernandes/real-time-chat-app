const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.handshake.query.userId);

    socket.on('message', (message) => {
        io.emit('message', message);
    })

    socket.on('typing', (typingData) => {
        // Broadcast the message to all connected clients
        socket.broadcast.emit('userTyping', {
            userId: socket.handshake.query.userId,
            isTyping: typingData.isTyping
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.handshake.query.userId);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});