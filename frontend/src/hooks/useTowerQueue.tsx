import { useState } from 'react';

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
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>
) => {
  const [queue, setQueue] = useState<Tower[]>([]);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  let nextId = 0; // Counter for unique IDs

  const buildTower = async (blocks: string[]) => {
    if (isBuilding) {
      alert("A tower is already being built.");
      return;
    }

    // Check if there are enough blocks in the inventory
    const blockCounts = blocks.reduce((acc, block) => {
      acc[block as InventoryKey] = (acc[block as InventoryKey] || 0) + 1;
      return acc;
    }, {} as Record<InventoryKey, number>);

    for (const block of Object.keys(blockCounts) as InventoryKey[]) {
      if (inventory[block] < blockCounts[block]) {
        alert(`Not enough ${block} blocks in inventory.`);
        return;
      }
    }

    // Create a new tower object with a unique ID
    const newTower: Tower = {
      id: nextId++, // Assign a unique ID
      block1: blocks[0],
      block2: blocks[1],
      block3: blocks[2],
    };

    // Update the queue
    setQueue(prevQueue => [...prevQueue, newTower]);
    setIsBuilding(true);

    // Send a message to the WebSocket server
    if (wsManagerRef.current) {
      wsManagerRef.current.sendMessage({ action: 'buildTower', tower: newTower });
    }

    // Simulate building process
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update inventory after building
    const updatedInventory = { ...inventory };
    blocks.forEach(block => {
      updatedInventory[block as InventoryKey] -= 1;
    });
    setInventory(updatedInventory);

    // Remove the tower from the queue
    setQueue(prevQueue => prevQueue.slice(1));
    setIsBuilding(false);
  };

  return {
    queue,
    isBuilding,
    buildTower,
  };
};