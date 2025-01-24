import { useState, useEffect } from 'react';
import axios from 'axios';

interface Inventory {
  [key: string]: number;
  Red: number;
  Green: number;
  Blue: number;
}

interface Tower {
  id: number; // Unique id for each tower
  block1: string;
  block2: string;
  block3: string;
}

interface WebSocketManager {
  sendMessage: (message: any) => void;
  isConnected: boolean;
}

export const useTowerQueue = (
  wsManagerRef: React.RefObject<WebSocketManager | null>,
  inventory: Inventory,
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>,
  isFactoryRunning: boolean,
  setQueue: React.Dispatch<React.SetStateAction<Tower[]>>
) => {
  const [queue, setQueueState] = useState<Tower[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  // Load initial queue from the backend
  useEffect(() => {
    axios.get('http://localhost:5000/queue')
      .then((response) => {
        setQueueState(response.data);
      })
      .catch((error) => {
        console.error('Error fetching queue:', error);
      });
  }, []);

  // Save queue to the backend whenever it changes
  useEffect(() => {
    axios.post('http://localhost:5000/queue', { queue })
      .catch((error) => {
        console.error('Error saving queue:', error);
      });
  }, [queue]);

  const processQueue = async () => {
    if (!isFactoryRunning || queue.length === 0) return; // Pause if factory is stopped or queue is empty

    const nextTower = queue[0]; // Get the first tower in the queue
    const blocks = [nextTower.block1, nextTower.block2, nextTower.block3];

    // Check if there are enough blocks
    if (inventory[nextTower.block1] > 0 && inventory[nextTower.block2] > 0 && inventory[nextTower.block3] > 0) {
      setIsBuilding(true);

      // Send a message to the WebSocket server
      if (wsManagerRef.current) {
        wsManagerRef.current.sendMessage({ action: 'buildTower', blocks: [nextTower.block1, nextTower.block2, nextTower.block3] });
      }

      // Simulate building process
      await new Promise<void>((resolve) => setTimeout(resolve, 3000));

      // Update inventory after building
      const updatedInventory = { ...inventory };
      blocks.forEach((block) => {
        updatedInventory[block]--;
      });
      setInventory(updatedInventory);

      // Remove the tower from the queue
      setQueueState((prevQueue) => prevQueue.slice(1));
      setIsBuilding(false);

      // Process the next tower in the queue
      processQueue();
    } else {
      console.log('Insufficient blocks to construct the tower');
      // Wait until there are enough blocks
      setTimeout(() => {
        processQueue();
      }, 1000); // Check every 1 second
    }
  };

  const buildTower = async (blocks: string[]) => {
    // Ensure blocks is an array with exactly 3 elements
    if (!Array.isArray(blocks) || blocks.length !== 3) {
      alert("Invalid tower configuration. Please select exactly 3 blocks.");
      return;
    }

    // Create a new tower object
    const newTower: Tower = {
      id: Date.now(), // Use timestamp as a unique ID
      block1: blocks[0],
      block2: blocks[1],
      block3: blocks[2],
    };

    // Check if the tower already exists in the queue
    const existingTower = queue.find((tower) => tower.id === newTower.id);
    if (existingTower) {
      console.log('Tower already exists in the queue');
      return;
    }

    // Update the queue
    setQueueState((prevQueue) => [...prevQueue, newTower]);

    // Wait for the WebSocket connection to be established
    await new Promise<void>((resolve) => {
      const intervalId = setInterval(() => {
        if (wsManagerRef.current && wsManagerRef.current.isConnected) {
          clearInterval(intervalId);
          resolve();
        }
      }, 100);
    });

    // Send the message to the WebSocket server
    if (wsManagerRef.current) {
      wsManagerRef.current.sendMessage({ action: 'buildTower', blocks: [newTower.block1, newTower.block2, newTower.block3] });
    }

    // Start processing the queue if not already building
    if (!isBuilding && isFactoryRunning) {
      processQueue();
    }
  };

  return {
    queue,
    isBuilding,
    buildTower,
  };
};