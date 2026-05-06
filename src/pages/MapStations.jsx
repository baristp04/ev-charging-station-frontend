export default function MapStations() {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
      <iframe 
        src="http://localhost:8000/map" 
        title="EV Charging Map"
        allow="geolocation"  /* İframe'e konum izni verdik */
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          backgroundColor: '#0a0f1e' 
        }}
      ></iframe>
    </div>
  );
}