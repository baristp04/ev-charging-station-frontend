import { useState, useEffect } from 'react';

export default function MapStations({ user }) {

    const [modalOpen, setModalOpen]                 = useState(false);
    const [reservationData, setReservationData]     = useState(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [vehicles, setVehicles]                   = useState([]);
    const [submitting, setSubmitting]               = useState(false);

    // Listen for postMessage events sent from navigation.html iframe
    useEffect(() => {
        const handleMessage = (e) => {
            if (e.data?.type !== 'OPEN_RESERVATION') return;

            const {
                stationId, stationName, charger,
                startTime, endTime, hours, estimatedCost
            } = e.data;

            setReservationData({ stationId, stationName, charger, startTime, endTime, hours, estimatedCost });
            setSelectedVehicleId('');
            setModalOpen(true);
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Fetch vehicles belonging to the logged-in driver
    useEffect(() => {
        if (!user?.driverID) return;

        fetch(`http://localhost:8000/api/v1/vehicles?driver_id=${user.driverID}`)
            .then(r => r.json())
            .then(setVehicles)
            .catch(console.error);
    }, [user]);

    // Submit the reservation to the backend API
    async function confirmReservation() {
        if (!selectedVehicleId || !reservationData) return;
        setSubmitting(true);

        const body = {
            driver_id:  user.driverID,
            charger_id: reservationData.charger.chargerID,
            vehicle_id: parseInt(selectedVehicleId),
            start_time: reservationData.startTime,
            end_time:   reservationData.endTime,
        };

        try {
            const res = await fetch('http://localhost:8000/api/stations/reserve', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                alert('Error: ' + (err.detail || 'Reservation failed.'));
                return;
            }

            setModalOpen(false);
            setSelectedVehicleId('');
            alert('✅ Reservation created successfully!');
        } catch {
            alert('Could not connect to server.');
        } finally {
            setSubmitting(false);
        }
    }

    // Close modal and reset vehicle selection
    function closeModal() {
        setModalOpen(false);
        setSelectedVehicleId('');
    }

    return (
        <div style={{
            position: 'relative',
            flex: 1,
            minHeight: 0,        // required for iframe to fill height in flex layout
            overflow: 'hidden',
        }}>

            {/* Navigation iframe — serves navigation.html from backend at /map */}
            <iframe
                src="http://localhost:8000/map"
                allow="geolocation"  // required to allow geolocation inside iframe
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                }}
                title="EV Charging Map"
            />

            {/* Reservation modal — opens after user clicks pay inside the iframe */}
            {modalOpen && reservationData && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    left: '260px', // offset to account for sidebar width
                }}>
                    <div style={{
                        background: '#111827',
                        border: '1px solid #1e2d45',
                        borderRadius: '14px',
                        padding: '28px',
                        width: '400px',
                        color: '#e8f0fe',
                        fontFamily: 'DM Sans, sans-serif',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }}>

                        {/* Station and charger header */}
                        <h3 style={{ marginBottom: '4px', fontSize: '18px', fontWeight: 600 }}>
                            {reservationData.stationName}
                        </h3>
                        <p style={{ color: '#6b7fa3', fontSize: '13px', marginBottom: '18px' }}>
                            {reservationData.charger.connectorType} · {reservationData.charger.powerOutput} kW · Unit #{reservationData.charger.chargerID}
                        </p>

                        {/* Reservation summary — time, duration, cost pre-calculated in iframe */}
                        <div style={{
                            background: 'rgba(0,229,255,0.06)',
                            border: '1px solid rgba(0,229,255,0.2)',
                            borderRadius: '10px',
                            padding: '14px 16px',
                            marginBottom: '20px',
                            fontSize: '13px',
                            lineHeight: '1.9',
                        }}>
                            <div>🕐 Start: <strong>{new Date(reservationData.startTime).toLocaleString('tr-TR')}</strong></div>
                            <div>🕑 End: <strong>{new Date(reservationData.endTime).toLocaleString('tr-TR')}</strong></div>
                            <div>⏱ Duration: <strong>{reservationData.hours} hour(s)</strong></div>
                            <div>💰 Estimated cost: <strong style={{ color: '#00ff9d' }}>{reservationData.estimatedCost}</strong></div>
                        </div>

                        {/* Show login warning if user is not authenticated */}
                        {!user ? (
                            <p style={{ color: '#ff3b5c', fontSize: '13px', textAlign: 'center', padding: '10px 0' }}>
                                You must be logged in to make a reservation.
                            </p>
                        ) : (
                            <>
                                {/* Vehicle selection dropdown */}
                                <label style={{
                                    display: 'block',
                                    fontSize: '10px',
                                    fontFamily: 'Space Mono, monospace',
                                    color: '#6b7fa3',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.09em',
                                    marginBottom: '6px',
                                }}>
                                    Select Vehicle
                                </label>
                                <select
                                    value={selectedVehicleId}
                                    onChange={e => setSelectedVehicleId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        marginBottom: '20px',
                                        background: '#1a2235',
                                        border: '1px solid #1e2d45',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        color: '#e8f0fe',
                                        fontSize: '13px',
                                        outline: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value=''>Select a vehicle...</option>
                                    {vehicles.map(v => (
                                        <option key={v.vehicleID} value={v.vehicleID}>
                                            {v.brand} {v.model} — {v.plateNumber}
                                        </option>
                                    ))}
                                </select>

                                {/* Cancel and confirm buttons */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={closeModal}
                                        style={{
                                            flex: 1,
                                            padding: '11px',
                                            borderRadius: '8px',
                                            border: '1px solid #1e2d45',
                                            background: 'transparent',
                                            color: '#6b7fa3',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontFamily: 'DM Sans, sans-serif',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmReservation}
                                        disabled={!selectedVehicleId || submitting}
                                        style={{
                                            flex: 2,
                                            padding: '11px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: selectedVehicleId && !submitting
                                                ? 'linear-gradient(135deg, #00e5ff, #00ff9d)'
                                                : '#1e2d45',
                                            color: selectedVehicleId && !submitting ? '#0a0f1e' : '#6b7fa3',
                                            fontWeight: '700',
                                            cursor: selectedVehicleId && !submitting ? 'pointer' : 'not-allowed',
                                            fontSize: '13px',
                                            fontFamily: 'DM Sans, sans-serif',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {submitting ? 'Submitting...' : '✅ Confirm Reservation'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}