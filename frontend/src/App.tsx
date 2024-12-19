import React, { useState, useRef } from 'react';
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
    const [inventory, setInventory] = useState<Inventory>({ Red: 0, Green: 0, Blue: 0 });
    const [blocks, setBlocks] = useState<string[]>(['Red', 'Green', 'Blue']);
    const [status, setStatus] = useState<string>('Waiting for tower configuration.');

    const wsManagerRef = useRef<{ sendMessage: (message: any) => void } | null>(null);

    // Use the custom hook to manage the tower queue
    const { queue, buildTower } = useTowerQueue(wsManagerRef, inventory, setInventory);

    const controlFactory = async (command: "START" | "STOP") => {
        try {
            if (command === "START" && status === "Factory process started.") {
                alert("Factory is already running.");
                return;
            }

            if (command === "STOP" && status === "Factory process stopped.") {
                alert("Factory is already stopped.");
                return;
            }

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
            <TowerConfig blocks={blocks} setBlocks={setBlocks} inventory={inventory} wsManagerRef={wsManagerRef} buildTower={buildTower} />
            <StatusDisplay status={status} />
            <FactoryControl controlFactory={controlFactory} />
            <QueueDisplay queue={queue} /> {/* Render the queue display */}
            <WebSocketManager ref={wsManagerRef} setInventory={setInventory} setStatus={setStatus} />
        </div>
    );
};

export default App;