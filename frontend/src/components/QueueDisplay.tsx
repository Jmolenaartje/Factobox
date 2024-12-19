import React from 'react';

interface Tower {
    id: number;
    block1: string;
    block2: string;
    block3: string;
}

interface QueueDisplayProps {
    queue: Tower[];
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({ queue }) => {
    return (
        <div>
            <h2>Queue</h2>
            <ul>
                {queue.map((tower, index) => (
                    <li key={tower.id}>
                        {index + 1}. Block 1: {tower.block1}, Block 2: {tower.block2}, Block 3: {tower.block3}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default QueueDisplay;