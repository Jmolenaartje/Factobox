import React from 'react';

interface QueueDisplayProps {
    queue: { block1: string; block2: string; block3: string }[];
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({ queue }) => {
    return (
        <div>
            <h2>Queue</h2>
            <ul>
                {queue.map((tower, index) => (
                    <li key={index}>
                        {tower.block1}, {tower.block2}, {tower.block3}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default QueueDisplay;