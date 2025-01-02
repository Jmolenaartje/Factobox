import { useState, useRef, useEffect } from 'react';

interface Inventory {
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

// Define a union type for the keys of Inventory
type InventoryKey = keyof Inventory;

export const useTowerQueue = (
  wsManagerRef: React.RefObject<{ sendMessage: (message: any) => void } | null>,
  inventory: Inventory,
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>,
  isFactoryRunning: boolean,
  queue: Tower[], // Use the queue passed from App.tsx
  setQueue: React.Dispatch<React.SetStateAction<Tower[]>> // Use the setQueue passed from App.tsx
) => {
  const [isBuilding, setIsBuilding] = useState<boolean>(false);

  // Initialize nextId from localStorage or start from 1
  const nextId = useRef<number>(
    parseInt(localStorage.getItem('nextId') || '1', 10)
  );

  // Save nextId to localStorage whenever the queue changes
  useEffect(() => {
    localStorage.setItem('nextId', nextId.current.toString());
  }, [queue]);

  const processQueue = async () => {
    if (!isFactoryRunning || isBuilding || queue.length === 0) return; // Pause if factory is stopped

    setIsBuilding(true);
    const nextTower = queue[0]; // Get the first tower in the queue

    // Send a message to the WebSocket server
    if (wsManagerRef.current) {
      wsManagerRef.current.sendMessage({ action: 'buildTower', tower: nextTower });
    }

    // Simulate building process
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Update inventory after building
    const updatedInventory = { ...inventory };
    const blocks = [nextTower.block1, nextTower.block2, nextTower.block3];
    blocks.forEach((block) => {
      updatedInventory[block as InventoryKey] -= 1;
    });
    setInventory(updatedInventory);

    // Remove the tower from the queue
    setQueue((prevQueue) => prevQueue.slice(1));
    setIsBuilding(false);

    // Process the next tower in the queue
    processQueue();
  };

  const buildTower = async (blocks: string[]) => {
    // Ensure blocks is an array with exactly 3 elements
    if (!Array.isArray(blocks) || blocks.length !== 3) {
      alert("Invalid tower configuration. Please select exactly 3 blocks.");
      return;
    }

    // Create a new tower object with a unique ID
    const newTower: Tower = {
      id: nextId.current++, // Assign a unique ID starting from the persisted value
      block1: blocks[0],
      block2: blocks[1],
      block3: blocks[2],
    };

    // Update the queue
    setQueue((prevQueue) => [...prevQueue, newTower]);

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