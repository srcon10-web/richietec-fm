const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
let broadcaster = null;
const DJ_PASS = process.env.DJ_PASSWORD || "Richietec2026!";

io.on('connection', socket => {
  socket.emit('live-status', broadcaster!== null);
  
  socket.on('dj-auth', (pwd, cb) => cb(pwd === DJ_PASS));
  
  socket.on('broadcaster', () => { 
    broadcaster = socket.id; 
    io.emit('live-status', true); 
    console.log('ON AIR:', broadcaster);
  });
  
  socket.on('broadcaster-stop', () => { 
    broadcaster = null; 
    io.emit('live-status', false);
    console.log('OFF AIR');
  });
  
  socket.on('watcher', () => { if(broadcaster) io.to(broadcaster).emit('watcher', socket.id); });
  socket.on('offer', (id, msg) => io.to(id).emit('offer', socket.id, msg));
  socket.on('answer', (id, msg) => io.to(id).emit('answer', socket.id, msg));
  socket.on('candidate', (id, msg) => io.to(id).emit('candidate', socket.id, msg));

  // FIX: CHAT & REQUESTS - THIS WAS MISSING
  socket.on('chat-message', (data) => {
    console.log('Chat:', data);
    io.emit('chat-message', data); // Send to everyone including DJ
  });
  
  socket.on('song-request', (data) => {
    console.log('Request:', data);
    io.emit('new-request', data); // Send to everyone, DJ will see it
    // Also send to DJ specifically if you want
    if(broadcaster) io.to(broadcaster).emit('new-request', data);
  });

  socket.on('disconnect', () => { 
    if(socket.id === broadcaster){ 
      broadcaster = null; 
      io.emit('live-status', false); 
    } 
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('RICHIE TEC FM LIVE WITH REQUESTS ON',PORT));

