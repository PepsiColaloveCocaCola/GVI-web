// src/components/IntroSection.jsx
import React, { useRef, useState, useEffect } from 'react';
import basemap from "../assets/basemap.png";
import guideline from "../assets/guidline.png";
import './ScrollIntro.css';
import greenviewData from "../data/greenviewData";

const ScrollIntro = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const designWidth = 1920;
      const designHeight = 1080;
      const scaleX = window.innerWidth / designWidth;
      const scaleY = window.innerHeight / designHeight;
      setScale(Math.min(scaleX, scaleY));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div className="intro-outer">
      <div
        className="intro-container"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: '1920px',
          height: '1080px',
        }}
      >
        <img src={basemap} alt="basemap" className="layer base" />
        <img src={guideline} alt="guideline" className="layer guide" />

        {greenviewData.map((img, index) => (
          <img
            key={index}
            src={img.src}
            alt={`greenview-${index}`}
            className="layer green"
            style={{
              top: `${img.top}px`,
              left: `${img.left}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ScrollIntro;