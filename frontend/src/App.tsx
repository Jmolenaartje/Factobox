import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import InventoryDisplay from './components/InventoryDisplay';
import TowerConfig from './components/TowerConfig';
import StatusDisplay from './components/StatusDisplay';
import FactoryControl from './components/FactoryControl';
import QueueDisplay, { Tower } from './components/QueueDisplay'; // Import Tower interface
import WebSocketManager from './components/WebSocketManager';
import { useTowerQueue } from './hooks/useTowerQueue';

type Inventory = {
  Red: number;
  Green: number;
  Blue: number;
};

const App: React.FC = () => {
  const [inventory, setInventory] = useState<Inventory>({ Red: 0, Green: 0, Blue: 0 });
  const [blocks, setBlocks] = useState<string[]>(['Red', 'Green', 'Blue']);
  const [status, setStatus] = useState<string>('Waiting for tower configuration.');
  const [queue, setQueue] = useState<Tower[]>([]);

  const wsManagerRef = useRef<{ sendMessage: (message: any) => void } | null>(null);

  // Use the custom hook to manage the tower queue
  const { buildTower } = useTowerQueue(wsManagerRef, inventory, setInventory);

  const controlFactory = async (command: "START" | "STOP") => {
    try {
      const res = await axios.post("http://localhost:5000/command", { command: command.toLowerCase() }, {
        withCredentials: true, // Send credentials (e.g., cookies) with the request
      });
      console.log(res.data);
      setStatus(`Factory process ${command.toLowerCase()}ed.`);
    } catch (error) {
      console.error(`Error ${command.toLowerCase()}ing the factory:`, error);
      setStatus(`Error ${command.toLowerCase()}ing the factory.`);
    }
  };

  const handleBuildTower = async (blocks: string[]) => {
    const newTower: Tower = {
      id: queue.length,
      block1: blocks[0],
      block2: blocks[1],
      block3: blocks[2],
    };

    setQueue((prevQueue) => [...prevQueue, newTower]);
    buildTower(blocks);
  };

  return (
    <div className="app-container">
      <h1>Block Tower Builder</h1>
      <InventoryDisplay inventory={inventory} />
      <TowerConfig blocks={blocks} setBlocks={setBlocks} inventory={inventory} wsManagerRef={wsManagerRef} buildTower={handleBuildTower} />
      <StatusDisplay status={status} />
      <FactoryControl controlFactory={controlFactory} />
      <QueueDisplay queue={queue} />
      <WebSocketManager ref={wsManagerRef} setInventory={setInventory} setStatus={setStatus} />
    </div>
  );
};

export default App;