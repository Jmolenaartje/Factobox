import React, { useState } from 'react';
import './App.css';
import axios from 'axios';

function App() {
    const [response, setResponse] = useState<string>("");

    const callApi = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api");
            setResponse(res.data);
        } catch (error) {
            console.error("Error calling the API:", error);
            setResponse("Error calling the API");
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>React with TypeScript</h1>
                <button onClick={callApi}>Call API</button>
                <p>{response}</p>
            </header>
        </div>
    );
}

export default App;