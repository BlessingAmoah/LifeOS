// Minimal static file server for Azure App Service (Linux)
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use('/node_modules', (_req, res) => res.sendStatus(404));

// Serve static files from current directory (dist files are at root)
app.use(express.static(path.join(__dirname), {
  index: false, // Don't auto-serve index.html, we'll handle it manually
  extensions: ['html', 'js', 'css', 'json', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'woff', 'woff2', 'ttf', 'eot']
}));

// Handle React Router - all routes serve index.html (SPA routing)
app.get('*', (req, res) => {
  // Always serve index.html for React Router
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Frontend server running on port ${PORT}`);
  console.log(`✓ Serving static files from: ${__dirname}`);
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
