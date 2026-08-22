const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Range");
  next();
});

const PORT = process.env.PORT || 10000;

// This is the fix for your 0:00 issue
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  
  // Put an mp3 file named 'audio.mp3' in your repo root
  // Or change this to your live source
  const filePath = path.join(__dirname, 'audio.mp3');
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('audio.mp3 not found - upload an mp3 file to your repo');
  }

  const stat = fs.statSync(filePath);
  res.setHeader('Content-Length', stat.size);
  
  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

app.get('/', (req, res) => {
  res.send('Richietec FM is live at /stream');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on', PORT);
});
