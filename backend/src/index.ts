import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { WebSocketServer, WebSocket } from 'ws';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { setTimeout } from 'timers/promises';

// Express server setup
const app = express();
app.use(cors());
app.use(express.json());

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
          const commandToArduino = `TOWER,${block1.charAt(0)},${block2.charAt(0)},${block3.charAt(0)}\n`; //Use the first letter for the command
          /*serialPort.write(commandToArduino, (err) => {
            if (err) {
              console.error('Error sending command to Arduino:', err);
            } else {
              console.log('Command sent to Arduino:', commandToArduino);
            }
          });*/
  
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

  try {
    switch (command) {
      case 'START':
        // Send start command to Arduino
        serialPort.write('START\n', (err) => {
          if (err) {
            console.error('Error sending START command:', err);
            return res.status(500).json({ error: 'Failed to send START command' });
          }
          isFactoryRunning = true;
          res.json({ message: 'Factory process started', status: isFactoryRunning });
        });
        break;

      case 'STOP':
        // Send stop command to Arduino
        serialPort.write('STOP\n', (err) => {
          if (err) {
            console.error('Error sending STOP command:', err);
            return res.status(500).json({ error: 'Failed to send STOP command' });
          }
          isFactoryRunning = false;
          res.json({ message: 'Factory process stopped', status: isFactoryRunning });
        });
        break;

      default:
        res.status(400).json({ error: 'Invalid command' });
    }
  } catch (error) {
    console.error('Error processing command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle Serial Port Errors
serialPort.on('error', (error) => {
  console.error('Serial Port Error:', error);
});

// Express API endpoint
app.get('/api', (req, res) => {
  res.send('Hello from the backend!');
});

// Status endpoint to check factory state
app.get('/status', (req, res) => {
  res.json({ 
    isFactoryRunning, 
    inventory 
  });
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});