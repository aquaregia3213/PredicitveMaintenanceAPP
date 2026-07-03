import express from 'express';
import path from 'path';
import { predictHandler, analyticsHandler } from './server-api';

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser
app.use(express.json());

// Mount the predict API route
app.post('/api/predict', (req, res) => {
  predictHandler(req, res);
});

// Mount the analytics dataset route
app.get('/api/analytics', (req, res) => {
  analyticsHandler(req, res);
});

// Serve static assets from Vite's build directory
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback to index.html for Single Page App routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});
