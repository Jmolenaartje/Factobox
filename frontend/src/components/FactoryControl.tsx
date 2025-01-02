import React from 'react';

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

export default FactoryControl;