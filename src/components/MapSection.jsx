import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapSection = () => {
  const [roadsData, setRoadsData] = useState(null);
  const [pointsData, setPointsData] = useState(null);
  const [greenspacesData, setGreenspacesData] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [evaluation, setEvaluation] = useState('');
  const [evaluationsList, setEvaluationsList] = useState([]);  // 存储评价列表
  const mapRef = useRef(null);
  const greenLayerRef = useRef(null);

  // 加载已有评价
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        if (!selectedFeature?.id) return;
        
        const response = await fetch(`http://localhost:3001/evaluations/${selectedFeature.id}`);
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
    const hue = (1 - value) * 120;
    return `hsl(${hue}, 100%, 50%)`;
  };



  const highlightFeature = (e) => {
    const layer = e.target;
    layer.setStyle({
      weight: 3,
      color: '#ff0000',
      fillOpacity: 0.7
    });
    layer.bringToFront();
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
      const res = await fetch('http://localhost:3001/evaluate', {
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
      const evaluationRes = await fetch(`http://localhost:3001/evaluations/${selectedFeature.id}`);
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

  return (
    <div style={{ height: '100vh' }}>
      <MapContainer
        center={[30.25, 120.16]}
        zoom={13}
        style={{ height: '100%', width: '100%', backgroundColor: '#fff'  }}
        whenCreated={(map) => (mapRef.current = map)}
      >

        {roadsData && <GeoJSON data={roadsData} style={{ color: '#555', weight: 2 }} />}

        {greenspacesData && (
          <GeoJSON
            data={greenspacesData}
            style={{ fillColor: '#4CAF50', color: '#2E7D32', weight: 1, fillOpacity: 0.5 }}
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
            if (typeof value !== "number") return null
            return (
              <CircleMarker
                key={i}
                center={[coords[1], coords[0]]}
                radius={8}
                color="#000"
                fillColor={getColorForPoint(value)}
                fillOpacity={0.8}
              >
                <Popup>??: {value.toFixed(2)}</Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>

      {/* ?? */}
      {selectedFeature && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          width: 300,
          zIndex: 1000,
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0',
            fontSize: '18px',
            color: '#333'
          }}>{selectedFeature.name}</h3>
          
          {/* 评价列表区域 */}
          {evaluationsList.length > 0 && (
            <div style={{
              marginBottom: '20px',
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #eee',
              borderRadius: '4px',
              padding: '10px'
            }}>
              <h4 style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                color: '#666'
              }}>历史评价：</h4>
              {evaluationsList.map((evaluation, index) => (
                <div key={evaluation.id || index} style={{
                  padding: '8px',
                  borderBottom: index < evaluationsList.length - 1 ? '1px solid #eee' : 'none',
                  fontSize: '14px'
                }}>
                  <div style={{ color: '#333' }}>{evaluation.comment}</div>
                  <div style={{ 
                    fontSize: '12px',
                    color: '#999',
                    marginTop: '4px'
                  }}>
                    {new Date(evaluation.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 新评价输入区域 */}
          <div>
            <h4 style={{
              margin: '0 0 10px 0',
              fontSize: '14px',
              color: '#666'
            }}>添加新评价：</h4>
            <textarea
              value={evaluation}
              onChange={(e) => setEvaluation(e.target.value)}
              placeholder="请输入对绿地的评价"
              style={{
                width: '100%',
                height: '100px',
                padding: '10px',
                marginBottom: '15px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <button 
              onClick={() => setSelectedFeature(null)}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: '#fff',
                cursor: 'pointer',
                color: '#666',
                minWidth: '80px',
                fontFamily: 'inherit',
                fontSize: '14px',
                '&:hover': {
                  background: '#f5f5f5'
                }
              }}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                minWidth: '80px',
                fontFamily: 'inherit',
                fontSize: '14px',
                '&:hover': {
                  backgroundColor: '#45a049'
                }
              }}
            >
              提交评价
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSection;
