const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Keep track of broadcasters and listeners
const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
let broadcaster = null;
let listeners = new Map();

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);
    
    socket.on('broadcaster', () => {
        broadcaster = socket.id;
        socket.broadcast.emit('live-status', true);
        io.emit('live-status', true);
        console.log('Broadcaster connected:', socket.id);
    });
    
    socket.on('broadcaster-stop', () => {
        broadcaster = null;
        io.emit('live-status', false);
        console.log('Broadcaster disconnected');
    });
    
    socket.on('watcher', () => {
        if (broadcaster) {
            io.to(broadcaster).emit('watcher', socket.id);
            listeners.set(socket.id, true);
            console.log('New watcher:', socket.id);
        }
    });
    
    socket.on('offer', (id, offer) => {
        io.to(id).emit('offer', socket.id, offer);
    });
    
    socket.on('answer', (id, answer) => {
        io.to(id).emit('answer', socket.id, answer);
    });
    
    socket.on('candidate', (id, candidate) => {
        io.to(id).emit('candidate', socket.id, candidate);
    });
    
    socket.on('dj-auth', (password, callback) => {
        if (password === "Richietec2026!") {
            callback(true);
        } else {
            callback(false);
        }
    });
    
    socket.on('chat-message', (data) => {
        io.emit('chat-message', data);
    });
    
    socket.on('song-request', (data) => {
        io.emit('new-request', data);
    });
    
    socket.on('disconnect', () => {
        if (broadcaster === socket.id) {
            broadcaster = null;
            io.emit('live-status', false);
        }
        listeners.delete(socket.id);
        console.log('Disconnected:', socket.id);
    });
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

// Get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const PORT = 3000;
const localIP = getLocalIP();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`🎵 RICHIE TEC FM 101.5 - Radio Server`);
    console.log(`=========================================`);
    console.log(`📡 Server running on:`);
    console.log(`   - Local:  http://localhost:${PORT}`);
    console.log(`   - Network: http://${localIP}:${PORT}`);
    console.log(`   - Public: http://YOUR_PUBLIC_IP:${PORT}`);
    console.log(`=========================================`);
    console.log(`📋 Instructions:`);
    console.log(`1. Go to: http://${localIP}:${PORT}`);
    console.log(`2. DJ Password: Richietec2026!`);
    console.log(`3. For outside access, configure port forwarding`);
    console.log(`4. Share: http://YOUR_PUBLIC_IP:${PORT}`);
    console.log(`=========================================`);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => process.exit(0));
});
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('RICHIE TEC FM LIVE WITH REQUESTS ON',PORT));
