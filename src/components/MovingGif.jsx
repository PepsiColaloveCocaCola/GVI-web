import React, { useState, useEffect, useRef } from 'react';
import './MovingGif.css';

const MovingGif = ({ gifSrc }) => {
  const [position, setPosition] = useState({ x: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef(null);
  const modalRef = useRef(null); // ���ģ̬���ref

  useEffect(() => {
    if (isHovered) return;

    let animationFrameId;
    let direction = 1;
    let speed = 2;

    const animate = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const gifWidth = 100;

      setPosition(prev => {
        let newX = prev.x + speed * direction;

        if (newX >= containerWidth - gifWidth) {
          direction = -1;
          newX = containerWidth - gifWidth;
          speed = 1 + Math.random() * 3;
        } else if (newX <= 0) {
          direction = 1;
          newX = 0;
          speed = 1 + Math.random() * 3;
        }

        return { x: newX };
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered]);

  // ��ӵ���ⲿ�رյ����ļ�����
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  return (
    <div className="gif-container" ref={containerRef}>
      <img
        src={gifSrc}
        alt="Moving GIF"
        className="moving-gif"
        style={{
          transform: `translateX(${position.x}px)`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowModal(true)}
      />

      {showModal && (
        <div className="modal-overlay">
          <div 
            className="modal-content"
            ref={modalRef} // ʹ��ref��ʶ��ģ̬������
          >
            <p>? ������Դ��Green Index Project<br />? ��Ȩ��ԭ�������С�</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovingGif;