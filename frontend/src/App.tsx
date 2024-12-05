import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

interface Inventory {
  Red: number;
  Green: number;
  Blue: number;
}

const BlockSelector: React.FC<{
  block: string;
  setBlock: (block: string) => void;
}> = ({ block, setBlock }) => {
  return (
    <label>
      Block:
      <select value={block} onChange={(e) => setBlock(e.target.value)}>
        <option value="Red">Red</option>
        <option value="Green">Green</option>
        <option value="Blue">Blue</option>
      </select>
    </label>
  );
};

const App: React.FC = () => {
  const [inventory, setInventory] = useState<Inventory>({
    Red: 0,
    Green: 0,
    Blue: 0,
  });
  const [blocks, setBlocks] = useState<string[]>(['Red', 'Green', 'Blue']);
  const [status, setStatus] = useState<string>('Waiting for tower configuration...');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [response, setResponse] = useState<string>("");

  // Establish WebSocket connection
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    setWs(socket);

    socket.onmessage = (event) => {
      const updatedInventory = JSON.parse(event.data);
      setInventory(updatedInventory);
    };

    return () => {
      socket.close();
    };
  }, []);

  // Handle Tower Construction
  const buildTower = () => {
    if (!ws) return;

    const towerConfig = {
      block1: blocks[0],
      block2: blocks[1],
      block3: blocks[2],
    };

    ws.send(JSON.stringify(towerConfig));
    setStatus('Building the tower...');
  };

  // Call API
  const callApi = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api");
      setResponse(res.data);
    } catch (error) {
      console.error("Error calling the API:", error);
      setResponse("Error calling the API");
    }
  };

  // Start the factory process
  const startFactory = async () => {
    try {
      const res = await axios.post("http://localhost:5000/command", { command: "START" });
      console.log(res.data);
      setStatus('Factory process started.');
    } catch (error) {
      console.error("Error starting the factory:", error);
      setStatus('Error starting the factory.');
    }
  };

  // Stop the factory process
  const stopFactory = async () => {
    try {
      const res = await axios.post("http://localhost:5000/command", { command: "STOP" });
      console.log(res.data);
      setStatus('Factory process stopped.');
    } catch (error) {
      console.error("Error stopping the factory:", error);
      setStatus('Error stopping the factory.');
    }
  };

  return (
    <div className="app-container">
      <h1>Block Tower Builder</h1>
      <div className="inventory-section">
        <h2>Current Inventory</h2>
        <p>Red: {inventory.Red}</p>
        <p>Green: {inventory.Green}</p>
        <p>Blue: {inventory.Blue}</p>
      </div>
      <div className="tower-config-section">
        <h2>Configure Your Tower</h2>
        {blocks.map((block, index) => (
          <BlockSelector key={index} block={block} setBlock={(newBlock) => {
            const newBlocks = [...blocks];
            newBlocks[index] = newBlock;
            setBlocks(newBlocks);
          }} />
        ))}
        <br />
        <button onClick={buildTower} className="button">
          Build Tower
        </button>
      </div>
      <div className="status-section">
        <h2>Status</h2>
        <p>{status}</p>
      </div>
      <div className="api-section">
        <h2>API Call</h2>
        <button onClick={callApi}>Call API</button>
        <p>{response}</p>
      </div>
      <div className="factory-control-section">
        <h2>Factory Control</h2>
        <button 
          onClick={startFactory} 
          className="button start-button"
        >
          Start Factory Process
        </button>
        <button 
          onClick={stopFactory} 
          className="button stop-button"
        >
          Stop Factory Process
        </button>
      </div>
    </div>
  );
};

export default App;