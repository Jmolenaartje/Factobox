import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupWebSocket } from './websocket'; // Import the WebSocket setup function

// Express server setup
const app = express();
app.use(cors());
app.use(express.json());

// Load environment variables
dotenv.config();

// Setup WebSocket server
setupWebSocket(app); // Pass the Express app to the WebSocket setup

// Express API endpoint
app.get('/api', (req, res) => {
  console.log('Received a request to /api'); // Log the request
  console.log('Query parameters:', req.query); // Example of using req to access query parameters
  res.send('Hello from the backend!');
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});