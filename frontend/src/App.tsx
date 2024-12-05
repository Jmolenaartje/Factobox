import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import BlockSelector from './BlockSelector';
import WebSocketManager from './WebSocketManager'; // Import the WebSocketManager

interface Inventory {
    Red: number;
    Green: number;
    Blue: number;
}

const App: React.FC = () => {
    const [inventory, setInventory] = useState<Inventory>({ Red: 0, Green: 0, Blue: 0 });
    const [blocks, setBlocks] = useState<string[]>(['Red', 'Green', 'Blue']);
    const [status, setStatus] = useState<string>('Waiting for tower configuration...');
    const [response, setResponse] = useState<string>("");

    const wsManagerRef = useRef<{ sendMessage: (message: any) => void } | null>(null); // Create a ref for WebSocketManager

    const callApi = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api");
            setResponse(res.data);
        } catch (error) {
            console.error("Error calling the API:", error);
            setResponse("Error calling the API");
        }
    };

    const buildTower = () => {
      const towerConfig = { block1: blocks[0], block2: blocks[1], block3: blocks[2] };
        if (wsManagerRef.current) {
            wsManagerRef.current.sendMessage(towerConfig);
            setStatus('Building the tower...');
        } else {
            setStatus('WebSocket is not connected. Cannot build the tower.');
        }
    };

    const controlFactory = async (command: "START" | "STOP") => {
        try {
            const res = await axios.post("http://localhost:5000/command", { command });
            console.log(res.data);
            setStatus(`Factory process ${command.toLowerCase()}.`);
        } catch (error) {
            console.error(`Error ${command.toLowerCase()}ing the factory:`, error);
            setStatus(`Error ${command.toLowerCase()}ing the factory.`);
        }
    };

    return (
        <div className="app-container">
            <h1>Block Tower Builder</h1>
            <InventoryDisplay inventory={inventory} />
            <TowerConfig blocks={blocks} setBlocks={setBlocks} buildTower={buildTower} />
            <StatusDisplay status={status} />
            <ApiCall callApi={callApi} response={response} />
            <FactoryControl controlFactory={controlFactory} />
            <WebSocketManager ref={wsManagerRef} setInventory={setInventory} setStatus={setStatus} /> {/* Pass ref to WebSocketManager */}
        </div>
    );
};

const InventoryDisplay: React.FC<{ inventory: Inventory }> = ({ inventory }) => (
    <div className="inventory-section">
        <h2>Current Inventory</h2>
        <p>Red: {inventory.Red}</p>
        <p>Green: {inventory.Green}</p>
        <p>Blue: {inventory.Blue}</p>
    </div>
);

const TowerConfig: React.FC<{ blocks: string[], setBlocks: React.Dispatch<React.SetStateAction<string[]>>, buildTower: () => void }> = ({ blocks, setBlocks, buildTower }) => (
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
        <button onClick={buildTower} className="button">Build Tower</button>
    </div>
);

const StatusDisplay: React.FC<{ status: string }> = ({ status }) => (
    <div className="status-section">
        <h2>Status</h2>
        <p>{status}</p>
    </div>
);

const ApiCall: React.FC<{ callApi: () => void, response: string }> = ({ callApi, response }) => (
    <div className="api-section">
        <h2>API Call</h2>
        <button onClick={callApi}>Call API</button>
        <p>{response}</p>
    </div>
);

const FactoryControl: React.FC<{ controlFactory: (command: "START" | "STOP") => Promise<void> }> = ({ controlFactory }) => (
    <div className="factory-control-section">
        <h2>Factory Control</h2>
        <button onClick={() => controlFactory("START")} className="button start-button">
            Start Factory Process
        </button>
        <button onClick={() => controlFactory("STOP")} className="button stop-button">
            Stop Factory Process
        </button>
    </div>
);

export default App;