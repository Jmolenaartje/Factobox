import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { Console } from 'console';

// Express server setup
const app = express();

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from your frontend server
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
  credentials: true, // Allow credentials (e.g., cookies) to be sent with requests
}));

app.use(express.json()); // Parse JSON request bodies

// Load environment variables
dotenv.config();

// WebSocket server setup
const wss = new WebSocketServer({ port: 8080 });
console.log('WebSocket server running at ws://localhost:8080');

// Serial Port Configuration
const serialPort = new SerialPort({
  path: 'COM3',
  baudRate: 9600,
});

// Parser Configuration to Read Full Lines
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

// Block Inventory
interface Inventory {
  [key: string]: number;
}

let inventory: Inventory = {
  Red: 3,
  Green: 3,
  Blue: 3,
};

// Factory State
let isFactoryRunning = false;

// Handle WebSocket Connection
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected to WebSocket');

  // Send initial inventory to the client
  ws.send(JSON.stringify(inventory));

  // Handle incoming messages from the client
  ws.on('message', (message: string) => {
    try {
      console.log("INIT");
      const towerConfig = JSON.parse(message);
      
      // Make sure the action is correct
      if (towerConfig.action === "buildTower") {
        serialPort.write("INIT");
        const blocks = towerConfig.blocks; // Access the block array
        console.log('Blocks:', blocks); // Log of the blocks

        // Check if blocks is defined and is an array
        if (!blocks || !Array.isArray(blocks)) {
          console.log('Invalid message format');
          return; // Exit if the message format is invalid
        }

        // Verifies that the array has at least 3 blocks
        if (blocks.length < 3) {
          console.log('Not enough blocks provided');
          return; // Exit if there are not enough blocks
        }

        // Assign blocks to block 1-2-3
        const [block1, block2, block3] = blocks;

        // Check if enough blocks are available
        if (
          inventory[block1] > 0 &&
          inventory[block2] > 0 &&
          inventory[block3] > 0
        ) {
          // Deduct blocks used
          inventory[block1]--;
          inventory[block2]--;
          inventory[block3]--;

          // Send information to the Arduino about the blocks used.
          const commandToArduino = `TOWER,${block1.charAt(0)},${block2.charAt(0)},${block3.charAt(0)}\n`;
          serialPort.write(commandToArduino);

          // Notify all clients about updated inventory
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(inventory));
            }
          });

          console.log('Tower being constructed:', towerConfig);
        } else {
          console.log('Insufficient blocks to construct the tower');
        }
      } else {
        console.log('Invalid action in message');
      }
    } catch (error) {
      console.error('Error processing client message:', error);
    }
  });
});

// Read Data from Serial Port (Arduino)
parser.on('data', (data: string) => {
  console.log('Data received from Arduino:', data);

  try {
    const parsedData = JSON.parse(data);

    // Update inventory based on Arduino input
    inventory.Red = parsedData.red || inventory.Red;
    inventory.Green = parsedData.green || inventory.Green;
    inventory.Blue = parsedData.blue || inventory.Blue;

    // Notify all clients about updated inventory
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(inventory));
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error processing Arduino data:', error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
  }
});

// New endpoint for factory control
app.post('/command', (req, res) => {
  const { command } = req.body;

  if (command === 'start') {
    isFactoryRunning = true;
    // Send signal to Arduino board to start factory
    serialPort.write('START\n', (err) => {
      if (err) {
        console.error('Error sending signal to Arduino board:', err);
        res.status(500).json({ error: 'Error sending signal to Arduino board' });
      } else {
        console.log('Signal sent to Arduino board to start factory');
        res.status(200).json({ message: 'Factory started', status: isFactoryRunning });
      }
    });
  } else if (command === 'stop') {
    isFactoryRunning = false;
    // Send signal to Arduino board to stop factory
    serialPort.write('STOP\n', (err) => {
      if (err) {
        console.error('Error sending signal to Arduino board:', err);
        res.status(500).json({ error: 'Error sending signal to Arduino board' });
      } else {
        console.log('Signal sent to Arduino board to stop factory');
        res.status(200).json({ message: 'Factory stopped', status: isFactoryRunning });
      }
    });
  } else {
    res.status(400).json({ error: 'Invalid command' });
    console.log('Received invalid command:', command);
  }
});
// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});