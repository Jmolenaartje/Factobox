import React from 'react';
import BlockSelector from './BlockSelector';

// Define the Inventory type
type Inventory = {
    [key: string]: number; // This allows for any string key with a number value
};

const TowerConfig: React.FC<{
    blocks: string[];
    setBlocks: React.Dispatch<React.SetStateAction<string[]>>;
    wsManagerRef: React.RefObject<{ sendMessage: (message: any) => void }>; // WebSocket manager reference
    inventory: Inventory;
}> = ({ blocks, setBlocks, wsManagerRef, inventory }) => {

    const handleBlockChange = (index: number, newBlock: string) => {
        const newBlocks = [...blocks];
        newBlocks[index] = newBlock;
        setBlocks(newBlocks);
    };

    const handleBuildTower = () => {
        console.log('Inventory:', inventory);

        const blockCount: { [key: string]: number } = {}; // Object to count blocks needed
        const errorMessages: string[] = []; // Array to hold error messages
        const successMessages: string[] = []; // Array to hold success messages

        // Count how many of each block type is needed
        for (const block of blocks) {
            blockCount[block] = (blockCount[block] || 0) + 1;
        }

        // Check each block type in the current selection
        for (const block in blockCount) {
            const neededBlocks = blockCount[block]; // Total blocks needed for this type
            const availableBlocks = inventory[block] || 0; // Get the available blocks from inventory

            // Check if there are enough blocks
            if (availableBlocks < neededBlocks) {
                const missingCount = neededBlocks - availableBlocks; // Calculate how many are missing
                if (availableBlocks > 0) {
                    errorMessages.push(`You have ${availableBlocks} ${block} block(s) and need ${missingCount} more.`);
                } else {
                    errorMessages.push(`You need ${neededBlocks} more ${block} block(s). You have none in your inventory.`);
                }
            } else {
                successMessages.push(`You have enough ${block} block(s). You have ${availableBlocks} in your inventory.`);
            }
        }

        // If there are any error messages, show an alert
        if (errorMessages.length > 0) {
            alert(`Not enough blocks in the inventory:\n${errorMessages.join('\n')}`);
            return;
        }

        // If all blocks are available, show success messages
        if (successMessages.length > 0) {
            alert(`Success! You have enough blocks:\n${successMessages.join('\n')}`);
        }

        // If all blocks are available, proceed to build the tower
        console.log(blocks);
        if (wsManagerRef.current) {
            wsManagerRef.current.sendMessage({ action: 'buildTower', blocks });
        }
    };

    return (
        <div className="tower-config-section">
            <h2>Configure Your Tower</h2>
            {blocks.map((block, index) => (
                <BlockSelector key={index} block={block} setBlock={(newBlock) => handleBlockChange(index, newBlock)} />
            ))}
            <br />
            <button onClick={handleBuildTower} className="button">Build Tower</button>
        </div>
    );
};

export default TowerConfig;