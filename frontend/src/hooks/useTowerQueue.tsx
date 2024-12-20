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

export const useTowerQueue = (wsManagerRef: React.RefObject<{ sendMessage: (message: any) => void } | null>, inventory: Inventory, setInventory: React.Dispatch<React.SetStateAction<Inventory>>) => {
    const [queue, setQueue] = useState<Tower[]>([]);
    const [isBuilding, setIsBuilding] = useState<boolean>(false);

    const buildTower = async (blocks: string[]) => {
        // Check if there are enough blocks in the inventory
        const blockCounts = blocks.reduce((acc, block) => {
            acc[block as InventoryKey] = (acc[block as InventoryKey] || 0) + 1;
            return acc;
        }, {} as Record<InventoryKey, number>);

        for (const block of Object.keys(blockCounts) as InventoryKey[]) {
            if (inventory[block] < blockCounts[block]) {
                alert(`Not enough ${block} blocks in inventory.`);
                return; // Prevent building if not enough blocks
            }
        }

        // Create a new tower object with a unique ID using Date.now()
        const newTower: Tower = {
            id: Date.now(), // Use timestamp for a unique ID
            block1: blocks[0],
            block2: blocks[1],
            block3: blocks[2],
        };

        // Update the queue
        setQueue(prevQueue => [...prevQueue, newTower]);

        // Send a message to the WebSocket server, including the blocks
        if (wsManagerRef.current) {
            console.log('Sending message to WebSocket:', { action: 'buildTower', tower: newTower, blocks }); // Log the message
            wsManagerRef.current.sendMessage({ action: 'buildTower', tower: newTower, blocks });
        }

        // Process the queue if not already building
        processQueue();
    };

    const processQueue = async () => {
        if (isBuilding || queue.length === 0) return;

        const nextTower = queue[0];
        setIsBuilding(true);

        // Simulate building process
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Update inventory after building (this should be handled by the sensors/robotic arm)
        const updatedInventory = { ...inventory };
        updatedInventory[nextTower.block1 as InventoryKey] -= 1;
        updatedInventory[nextTower.block2 as InventoryKey] -= 1;
        updatedInventory[nextTower.block3 as InventoryKey] -= 1;
        setInventory(updatedInventory);

        // Remove the tower from the queue
        setQueue(prevQueue => prevQueue.slice(1));
        setIsBuilding(false);

        // Process the next tower in the queue
        processQueue();
    };

    return {
        queue,
        isBuilding,
        buildTower,
    };
};