const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let broadcasterId = null;
let listenerCount = 0;

io.on('connection', socket => {
  socket.on('broadcaster-start', () => {
    broadcasterId = socket.id;
    io.emit('broadcast-status', { live: true });
  });
  socket.on('broadcaster-stop', () => {
    broadcasterId = null;
    io.emit('broadcast-status', { live: false });
  });
  socket.on('join-as-listener', () => {
    listenerCount++; io.emit('listener-count', listenerCount);
    if(broadcasterId) io.to(broadcasterId).emit('new-listener', socket.id);
  });
  socket.on('offer', (id, offer) => io.to(id).emit('offer', socket.id, offer));
  socket.on('answer', (id, answer) => io.to(id).emit('answer', socket.id, answer));
  socket.on('ice-candidate', (id, c) => io.to(id).emit('ice-candidate', socket.id, c));
  socket.on('disconnect', () => {
    if(socket.id === broadcasterId){
      broadcasterId=null; io.emit('broadcast-status', { live: false });
    }
  });
});
server.listen(process.env.PORT || 3000);