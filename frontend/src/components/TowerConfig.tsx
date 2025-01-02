import React from 'react';
import BlockSelector from './BlockSelector';

const TowerConfig: React.FC<{
  blocks: string[];
  setBlocks: React.Dispatch<React.SetStateAction<string[]>>;
  buildTower: (blocks: string[]) => Promise<void>; // Added buildTower prop
}> = ({ blocks, setBlocks, buildTower }) => {
  const handleBlockChange = (index: number, newBlock: string) => {
    const newBlocks = [...blocks];
    newBlocks[index] = newBlock;
    setBlocks(newBlocks);
  };

  const handleBuildTower = async () => {
    // Ensure exactly 3 blocks are selected
    if (blocks.length !== 3) {
      alert("Please select exactly 3 blocks to build a tower.");
      return;
    }

    // Proceed to build the tower
    try {
      await buildTower(blocks); // Call the buildTower function
    } catch (error) {
      console.error("Error building tower:", error);
      alert("There was an error building the tower.");
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