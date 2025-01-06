import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import InventoryDisplay from './components/InventoryDisplay';
import TowerConfig from './components/TowerConfig';
import StatusDisplay from './components/StatusDisplay';
import QueueDisplay from './components/QueueDisplay';
import WebSocketManager from './components/WebSocketManager';
import { useTowerQueue } from './hooks/useTowerQueue';

type Inventory = {
  Red: number;
  Green: number;
  Blue: number;
};

type Tower = {
  id: number; // Unique id for each tower
  block1: string;
  block2: string;
  block3: string;
};

const App: React.FC = () => {
  // Initialize inventory state with default values
  const [inventory, setInventory] = useState<Inventory>({ Red: 3, Green: 3, Blue: 3 });

  // Fetch inventory data from the backend
  useEffect(() => {
    axios.get('http://localhost:5000/inventory')
      .then((response) => {
        setInventory(response.data);
      })
      .catch((error) => {
        console.error('Error fetching inventory:', error);
      });
  }, []);

  const [blocks, setBlocks] = useState<string[]>(['Red', 'Green', 'Blue']);
  const [status, setStatus] = useState<string>('Waiting for tower configuration.');
  const [isFactoryRunning, setIsFactoryRunning] = useState<boolean>(false); // Track factory state
  const [queue, setQueue] = useState<Tower[]>([]); // Initialize queue from database

  const wsManagerRef = useRef<{ sendMessage: (message: any) => void } | null>(null);

  // Load initial queue from database
  useEffect(() => {
    axios.get('http://localhost:5000/queue')
      .then((response) => {
        setQueue(response.data);
      })
      .catch((error) => {
        console.error('Error fetching queue:', error);
      });
  }, []);

  // Save queue to database whenever it changes
  useEffect(() => {
    axios.post('http://localhost:5000/queue', { queue })
      .catch((error) => {
        console.error('Error saving queue:', error);
      });
  }, [queue]);

  // Log the queue state whenever it updates
  useEffect(() => {
    console.log('Queue state after update:', queue); // Debugging
  }, [queue]);

  // Use the custom hook to manage the tower queue
  const { buildTower } = useTowerQueue(wsManagerRef, inventory, setInventory, isFactoryRunning, setQueue);

  const controlFactory = async (command: "START" | "STOP") => {
    try {
      if (command === "STOP") {
        if (!isFactoryRunning) {
          console.log('Factory is already stopped');
          return;
        }
        setIsFactoryRunning(false);
        const res = await axios.post("http://localhost:5000/stop-factory", {}, {
          withCredentials: true,
        });
        console.log(res.data);
        setStatus("Factory process stopped.");
      } else {
        if (isFactoryRunning) {
          console.log('Factory is already running');
          return;
        }
        setIsFactoryRunning(true);
        const res = await axios.post("http://localhost:5000/start-factory", {}, {
          withCredentials: true,
        });
        console.log(res.data);
        setStatus("Factory process started.");
      }
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
      <button onClick={() => controlFactory("START")}>Start Factory Process</button>
      <button onClick={() => controlFactory("STOP")}>Stop Factory Process</button>
      <QueueDisplay queue={queue} />
      <WebSocketManager ref={wsManagerRef} setInventory={setInventory} setStatus={setStatus} />
    </div>
  );
};

export default App;