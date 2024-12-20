import { useEffect, useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';

interface Inventory {
    Red: number;
    Green: number;
    Blue: number;
}

const WebSocketManager = forwardRef<{ sendMessage: (message: any) => void }, { setInventory: (inventory: Inventory) => void; setStatus: (status: string) => void; }>(({ setInventory, setStatus }, ref) => {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    // Wrap connectWebSocket in useCallback
    const connectWebSocket = useCallback(() => {
        socketRef.current = new WebSocket('ws://localhost:8080'); 
        socketRef.current.onopen = () => {
            console.log('WebSocket connection established');
            setIsConnected(true);
            setStatus('WebSocket connection established');
        };

        socketRef.current.onmessage = (event) => {
            try {
                const updatedInventory = JSON.parse(event.data);
                setInventory(updatedInventory);
            } catch (error) {
                console.error("Received data is not valid JSON:", event.data);
                setStatus(`Received non-JSON message: ${event.data}`);
            }
        };

        socketRef.current.onclose = () => {
            console.log('WebSocket connection closed');
            setIsConnected(false);
            setStatus('WebSocket connection closed. Attempting to reconnect...');
            setTimeout(connectWebSocket, 3000); //reconnect attempt after 3s
        };

        socketRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setStatus('WebSocket error occurred. Check console for details.');
        };
    }, [setInventory, setStatus]); // Dependencies for useCallback

    useEffect(() => {
        connectWebSocket(); // Establish WebSocket connection on mount

        //close WebSocket connection when component unmounts
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [connectWebSocket]); // Only include connectWebSocket in the dependencies

    // Function to send messages through the WebSocket
    const sendMessage = (message: any) => {
        if (socketRef.current && isConnected) {
            socketRef.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected. Cannot send message:', message);
            setStatus('WebSocket is not connected. Cannot send message.');
        }
    };

    useImperativeHandle(ref, () => ({
        sendMessage,
    }));

    return null; // This component does not render anything
});

export default WebSocketManager;