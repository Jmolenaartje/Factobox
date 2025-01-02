import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import InventoryDisplay from './components/InventoryDisplay';
import TowerConfig from './components/TowerConfig';
import StatusDisplay from './components/StatusDisplay';
import FactoryControl from './components/FactoryControl';
import QueueDisplay from './components/QueueDisplay';
import WebSocketManager from './components/WebSocketManager';
import { useTowerQueue } from './hooks/useTowerQueue';

type Inventory = {
  Red: number;
  Green: number;
  Blue: number;
};

const App: React.FC = () => {
  // Load initial state from localStorage or use defaults
  const [inventory, setInventory] = useState<Inventory>(() => {
    const savedInventory = localStorage.getItem('inventory');
    return savedInventory ? JSON.parse(savedInventory) : { Red: 3, Green: 3, Blue: 3 };
  });

  const [blocks, setBlocks] = useState<string[]>(['Red', 'Green', 'Blue']);
  const [status, setStatus] = useState<string>('Waiting for tower configuration.');
  const [isFactoryRunning, setIsFactoryRunning] = useState<boolean>(false); // Track factory state

  const wsManagerRef = useRef<{ sendMessage: (message: any) => void } | null>(null);

  // Save inventory to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Use the custom hook to manage the tower queue
  const { queue, buildTower } = useTowerQueue(wsManagerRef, inventory, setInventory, isFactoryRunning);

  const controlFactory = async (command: "START" | "STOP") => {
    try {
      const res = await axios.post("http://localhost:5000/command", { command: command.toLowerCase() }, {
        withCredentials: true,
      });
      console.log(res.data);
      setStatus(`Factory process ${command.toLowerCase()}ed.`);
      setIsFactoryRunning(command === "START"); // Update factory state
    } catch (error) {
      console.error(`Error ${command.toLowerCase()}ing the factory:`, error);
      setStatus(`Error ${command.toLowerCase()}ing the factory.`);
    }
  };

  const handleBuildTower = async (blocks: string[]) => {
    await buildTower(blocks);
  };

  return (
    <div className="app-container">
      <h1>Block Tower Builder</h1>
      <InventoryDisplay inventory={inventory} />
      <TowerConfig blocks={blocks} setBlocks={setBlocks} buildTower={handleBuildTower} />
      <StatusDisplay status={status} />
      <FactoryControl controlFactory={controlFactory} />
      <QueueDisplay queue={queue} />
      <WebSocketManager ref={wsManagerRef} setInventory={setInventory} setStatus={setStatus} />
    </div>
  );
};

export default App;