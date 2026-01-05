import { useEffect, useRef } from 'react';
import './index.css';

const AmbientBackground = () => {
  return (
    <div className="ambient-container">
      <div className="particle p1"></div>
      <div className="particle p2"></div>
      <div className="particle p3"></div>
      <div className="particle p4"></div>
      <div className="grid-overlay"></div>
    </div>
  );
};

export default AmbientBackground;