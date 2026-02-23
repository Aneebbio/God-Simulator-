const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', (socket) => {
    // When the "Loader" (Host) starts the game
    socket.on('host-start', (worldData) => {
        socket.join('game-room');
        socket.isHost = true;
        console.log("Main Player has loaded the world.");
    });

    // When a Guest joins
    socket.on('join-game', () => {
        socket.join('game-room');
        // Ask the Host to send the current 100x100 map to this new player
        io.to('game-room').emit('request-world-sync', socket.id);
    });

    // Pass data between players (Movements, Buildings, Rain)
    socket.on('action', (data) => {
        socket.to('game-room').emit('action', data);
    });
});

http.listen(3000, () => console.log('Server running on http://localhost:3000'));
