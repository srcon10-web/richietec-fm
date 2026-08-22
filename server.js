const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// FIX 1: Allow GitHub Pages to access it
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Range");
  next();
});

// FIX 2: Render requires this
const PORT = process.env.PORT || 8000;

// A simple status route
app.get('/', (req, res) => {
  res.send('Richietec FM is running. Go to /stream to listen');
});

// THE IMPORTANT ROUTE - This is what was missing
app.get('/stream', (req, res) => {
  // Option A: If you are streaming a live mp3 file / relay
  // Change the path to your actual audio file
  const audioPath = path.join(__dirname, 'live.mp3'); // or your stream source
  
  // For now, stream whatever audio you have, or proxy
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // If you have a file:
  if (fs.existsSync(audioPath)) {
    const stream = fs.createReadStream(audioPath);
    stream.pipe(res);
  } else {
    // If you are proxying Icecast / other source, use this example:
    // res.redirect('http://your-source-url');
    res.status(404).send('No audio file found at live.mp3 - upload one or set a source');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Richietec FM listening on ${PORT}`);
});
