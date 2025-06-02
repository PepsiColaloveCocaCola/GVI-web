// src/components/IntroSection.jsx
import React from 'react';
import basemap from "../assets/front.jpg";
import './ScrollIntro.css';

const ScrollIntro = () => {
  const scrollToMap = () => {
    const mapSection = document.querySelector('.map-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="intro-section">
      <div className="intro-container">
        <img src={basemap} alt="basemap" className="intro-image" />
        <button 
          className="start-button"
          onClick={scrollToMap}
          style={{ position: 'absolute' }}
        >
          开始
        </button>
      </div>
    </section>
  );
};

export default ScrollIntro;