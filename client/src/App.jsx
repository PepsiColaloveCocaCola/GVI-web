import React from 'react';
import ScrollIntro from './components/ScrollIntro';
import MapSection from './components/MapSection';
import MovingGif from './components/MovingGif';
import gifAnimation from './assets/电子宠物.gif';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <ScrollIntro />
      <MapSection />
    </div>
  );
}

export default App;
