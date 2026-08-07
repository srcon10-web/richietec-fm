const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let broadcasterId = null;

io.on('connection', socket => {
  socket.on('broadcaster', () => {
    broadcasterId = socket.id;
    io.emit('live-status', true);
  });
  socket.on('broadcaster-stop', () => {
    broadcasterId = null;
    io.emit('live-status', false);
  });
  socket.on('listener-join', () => {
    if(broadcasterId) io.to(broadcasterId).emit('new-listener', socket.id);
  });
  socket.on('offer', (id, offer) => io.to(id).emit('offer', socket.id, offer));
  socket.on('answer', (id, ans) => io.to(id).emit('answer', socket.id, ans));
  socket.on('ice', (id, cand) => io.to(id).emit('ice', socket.id, cand));
  socket.on('disconnect', () => {
    if(socket.id === broadcasterId){
      broadcasterId = null;
      io.emit('live-status', false);
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('RICHIE TEC FM LIVE'));
