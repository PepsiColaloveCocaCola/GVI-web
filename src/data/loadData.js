// src/data/loadData.js
export const loadGeoJSON = async (file) => {
  const response = await fetch(file);
  return await response.json();
};