import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapSection.css';
import MovingGif from './MovingGif';
import gifAnimation from '../assets/elcpet.GIF';

// Add custom popup styles
const customPopupStyle = {
  '.leaflet-popup-content-wrapper': {
    backgroundColor: '#4e4b41',
    color: '#ffffff',
    borderRadius: '5px',
    padding: '5px'
  },
  '.leaflet-popup-tip': {
    backgroundColor: '#4e4b41'
  }
};

const MapSection = () => {
  const [roadsData, setRoadsData] = useState(null);
  const [pointsData, setPointsData] = useState(null);
  const [greenspacesData, setGreenspacesData] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [evaluation, setEvaluation] = useState('');
  const [evaluationsList, setEvaluationsList] = useState([]);  // 存储评价列表
  const mapRef = useRef(null);
  const greenLayerRef = useRef(null);
  const [isFixed, setIsFixed] = useState(false);

  // 加载已有评价
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        if (!selectedFeature?.id) return;
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/evaluations/${selectedFeature.id}`);
        if (response.ok) {
          const data = await response.json();
          setEvaluationsList(data);  // 保存所有评价
          setEvaluation('');  // 清空输入框
        }
      } catch (error) {
        console.error('加载评价失败:', error);
      }
    };
    fetchEvaluations();
  }, [selectedFeature?.id]);

  // ?? GeoJSON ??
  useEffect(() => {
    const loadData = async () => {
      const roadsRes = await fetch('/roads.geojson');
      const pointsRes = await fetch('/points.geojson');
      const greenRes = await fetch('/greenspaces.geojson');
      const roadsJson = await roadsRes.json();
      const pointsJson = await pointsRes.json();
      const greenJson = await greenRes.json();
      setRoadsData(roadsJson);
      setPointsData(pointsJson);
      setGreenspacesData(greenJson);
    };
    loadData();
  }, []);

  const getColorForPoint = (value) => {
    // 将value（0-1）映射到更细致的色带上
    if (value < 0.3) {
      // 从深棕色到浅棕色
      const t = value / 0.3;
      const r = Math.round(139 * (1 - t) + 205 * t);
      const g = Math.round(69 * (1 - t) + 133 * t);
      const b = Math.round(19 * (1 - t) + 63 * t);
      return `rgb(${r},${g},${b})`;
    } else if (value < 0.6) {
      // 从浅棕色到黄绿色
      const t = (value - 0.3) / 0.3;
      const r = Math.round(205 * (1 - t) + 154 * t);
      const g = Math.round(133 * (1 - t) + 205 * t);
      const b = Math.round(63 * (1 - t) + 50 * t);
      return `rgb(${r},${g},${b})`;
    } else {
      // 从黄绿色到深绿色
      const t = (value - 0.6) / 0.4;
      const r = Math.round(154 * (1 - t) + 34 * t);
      const g = Math.round(205 * (1 - t) + 139 * t);
      const b = Math.round(50 * (1 - t) + 34 * t);
      return `rgb(${r},${g},${b})`;
    }
  };

  const highlightFeature = (e) => {
    const layer = e.target;
    layer.setStyle({
      fillOpacity: 1.0
    });
  };

  const resetHighlight = (e) => {
    greenLayerRef.current.resetStyle(e.target);
  };

  const onEachGreenFeature = (feature, layer) => {
    if (feature.properties?.name) {
      layer.bindTooltip(feature.properties.name);
    }

    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      // 修改点击事件处理部分（关键修复）
      click: (e) => {
        const feature = e.sourceTarget.feature;
        const clickedProps = feature.properties;
        console.log('修正后的属性:', clickedProps);

        const name = clickedProps.name;
        const id = clickedProps.id?.split('/').pop() || clickedProps['@id']?.split('/').pop();
        
        setSelectedFeature({
          name: name || `绿地 ${id}`,
          id: id
        });
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedFeature || !evaluation.trim()) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          greenId: selectedFeature.id,
          comment: evaluation.trim()
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`提交失败：${res.status} ${res.statusText} - ${errorText}`);
      }

      alert('评价提交成功 ✅');
      // 重新获取该绿地的评价
      const evaluationRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/evaluations/${selectedFeature.id}`);
      if (evaluationRes.ok) {
        const data = await evaluationRes.json();
        if (data.length > 0) {
          setEvaluation(data[0].comment);
        }
      }
    } catch (err) {
      alert(`出错了 😢：${err.message}`);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const mapSection = document.querySelector('.map-section');
      if (mapSection) {
        const rect = mapSection.getBoundingClientRect();
        if (rect.top <= 0 && !isFixed) {
          setIsFixed(true);
        } else if (rect.top > 0 && isFixed) {
          setIsFixed(false);
        }
      }
    };

    const preventScroll = (e) => {
      if (isFixed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('scroll', handleScroll);
    const mapSection = document.querySelector('.map-section');
    
    if (mapSection) {
      mapSection.addEventListener('wheel', preventScroll, { passive: false });
      mapSection.addEventListener('touchmove', preventScroll, { passive: false });
      mapSection.addEventListener('mousewheel', preventScroll, { passive: false });
      mapSection.addEventListener('DOMMouseScroll', preventScroll, { passive: false });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mapSection) {
        mapSection.removeEventListener('wheel', preventScroll);
        mapSection.removeEventListener('touchmove', preventScroll);
        mapSection.removeEventListener('mousewheel', preventScroll);
        mapSection.removeEventListener('DOMMouseScroll', preventScroll);
      }
    };
  }, [isFixed]);

  return (
    <section className="map-section">
      <div className="map-container">
        <MapContainer
          center={[30.25, 120.16]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(map) => (mapRef.current = map)}
          scrollWheelZoom={true}
        >
         
          {roadsData && <GeoJSON data={roadsData} style={{ color: '#2b240d', weight: 2 }} />}

          {greenspacesData && (
            <GeoJSON
              data={greenspacesData}
              style={{ fillColor: '#039141', color: '#039141', weight: 1, fillOpacity: 0.5 }}
              onEachFeature={onEachGreenFeature}
              ref={(ref) => {
                greenLayerRef.current = ref;
              }}
            />
          )}

          {pointsData &&
            pointsData.features.map((pt, i) => {
              const coords = pt.geometry.coordinates;
              const value = pt.properties.NDVIhangzhou;
              if (typeof value !== "number") return null;
              return (
                <Circle
                  key={i}
                  center={[coords[1], coords[0]]}
                  radius={100}
                  pathOptions={{
                    color: getColorForPoint(value),
                    fillColor: getColorForPoint(value),
                    fillOpacity: 0.8,
                    weight: 0
                  }}
                >
                  <Popup className="custom-popup" closeButton={false}>
                    <div style={{ color: '#ffffff' }}>
                      {value.toFixed(2)}
                    </div>
                  </Popup>
                </Circle>
              );
            })}
        </MapContainer>
      </div>

      {selectedFeature && (
        <div className="feature-popup">
          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: '#4e4b41',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            width: 300,
            zIndex: 1000,
            border: '1px solid #3a3832',
            color: '#e1e1e0'
          }}>
            <button 
              className="close-button"
              onClick={() => setSelectedFeature(null)}
            >
              ×
            </button>
            <h3 style={{ 
              margin: '0 0 15px 0',
              fontSize: '18px',
              color: '#e1e1e0',
              paddingRight: '30px'
            }}>{selectedFeature.name}</h3>
            
            {evaluationsList.length > 0 && (
              <div style={{
                marginBottom: '20px',
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #3a3832',
                borderRadius: '4px',
                padding: '10px'
              }}>
                <h4 style={{
                  margin: '0 0 10px 0',
                  fontSize: '14px',
                  color: '#e1e1e0'
                }}>历史评价：</h4>
                {evaluationsList.map((evaluation, index) => (
                  <div key={evaluation.id || index} style={{
                    padding: '8px',
                    borderBottom: index < evaluationsList.length - 1 ? '1px solid #3a3832' : 'none',
                    fontSize: '14px'
                  }}>
                    <div style={{ color: '#e1e1e0' }}>{evaluation.comment}</div>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#a8a8a8',
                      marginTop: '4px'
                    }}>
                      {new Date(evaluation.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h4 style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                color: '#e1e1e0'
              }}>添加新评价：</h4>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <input
                  value={evaluation}
                  onChange={(e) => setEvaluation(e.target.value)}
                  placeholder="请输入对绿地的评价"
                  style={{
                    flex: 1,
                    height: '32px',
                    padding: '0 10px',
                    borderRadius: '4px',
                    border: '1px solid #3a3832',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    backgroundColor: '#5d5950',
                    color: '#e1e1e0'
                  }}
                />
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #3a3832',
                    borderRadius: '4px',
                    background: '#5d5950',
                    cursor: 'pointer',
                    color: '#e1e1e0',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
            
      <MovingGif gifSrc={gifAnimation} />
    </section>
  );
};

export default MapSection;
