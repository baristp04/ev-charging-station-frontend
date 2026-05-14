import { useState, useEffect, useRef } from 'react';
import { formatLocalTime } from '../utils/dateUtils';

export default function MapStations({ user }) {
    const iframeRef = useRef(null);

    const [mapReady, setMapReady]               = useState(false);
    const [modalOpen, setModalOpen]             = useState(false);
    const [reservationData, setReservationData] = useState(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [vehicles, setVehicles]               = useState([]);
    const [submitting, setSubmitting]           = useState(false);
    const [errorMsg, setErrorMsg]               = useState('');

    // Listen for postMessage events from the navigation.html iframe
    useEffect(() => {
        const handleMessage = (e) => {
            // Map signals it is fully initialised — remove the loading overlay
            if (e.data?.type === 'MAP_READY') {
                setMapReady(true);
                return;
            }

            if (e.data?.type !== 'OPEN_RESERVATION') return;

            const {
                stationId, stationName, charger,
                vehicleId,
                startTime, endTime, hours, estimatedCost
            } = e.data;

            setReservationData({ stationId, stationName, charger, startTime, endTime, hours, estimatedCost });
            setSelectedVehicleId(vehicleId ? String(vehicleId) : '');
            setErrorMsg('');
            setModalOpen(true);
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Fetch vehicles and send them to the navigation.html iframe
    useEffect(() => {
        if (!user?.driverID) return;

        fetch(`http://localhost:8000/api/v1/vehicles/driver/${user.driverID}`)
            .then(r => r.json())
            .then(data => {
                setVehicles(data);
                // Send vehicles to iframe so Step 1 of the reservation flow is populated
                const iframe = iframeRef.current;
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage({ type: 'SET_VEHICLES', vehicles: data }, '*');
                    iframe.contentWindow.postMessage({ type: 'SET_DRIVER', driverID: user.driverID }, '*');
                }
            })
            .catch(console.error);
    }, [user]);

    // Submit the confirmed reservation to the backend
    async function confirmReservation() {
        if (!selectedVehicleId || !reservationData) return;
        setSubmitting(true);
        setErrorMsg('');

        const body = {
            driver_id:      user.driverID,
            charger_id:     reservationData.charger.id || reservationData.charger.chargerID,
            vehicle_id:     parseInt(selectedVehicleId),
            startTime:      reservationData.startTime,
            endTime:        reservationData.endTime,
            // Strip currency symbol and parse to float before sending to backend
            estimated_cost: parseFloat(
                String(reservationData.estimatedCost).replace('₺', '').replace(',', '.').trim()
            ),
        };

        try {
            const res = await fetch('http://localhost:8000/api/stations/reserve', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                setErrorMsg(err.detail || 'Reservation failed.');
                return;
            }

            setModalOpen(false);
            setSelectedVehicleId('');
            setErrorMsg('');
            alert('✅ Reservation created successfully!');

        } catch {
            setErrorMsg('Could not connect to server.');
        } finally {
            setSubmitting(false);
        }
    }

    // Close the confirmation modal and reset state
    function closeModal() {
        setModalOpen(false);
        setSelectedVehicleId('');
        setErrorMsg('');
    }

    return (
        <div style={{
            position:  'relative',
            flex:       1,
            minHeight:  0,
            overflow:   'hidden',
        }}>

            {/* Navigation iframe — serves navigation.html from backend at /map */}
            <iframe
                src="http://localhost:8000/map"
                allow="geolocation"
                ref={iframeRef}
                onLoad={() => {
                    // Re-send vehicles after iframe reloads so Step 1 is always populated
                    if (vehicles.length && iframeRef.current) {
                        iframeRef.current.contentWindow.postMessage(
                            { type: 'SET_VEHICLES', vehicles }, '*');
                    }
                    // Re-send driver ID so favorites and driver-specific data reload correctly
                    if (user?.driverID && iframeRef.current) {
                        iframeRef.current.contentWindow.postMessage(
                            { type: 'SET_DRIVER', driverID: user.driverID }, '*');
                    }
                }}
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width:  '100%',
                    height: '100%',
                    border: 'none',
                }}
                title="EV Charging Map"
            />

            {/*
             * Loading overlay — shown until navigation.html sends MAP_READY.
             *
             * FIX: overlay is placed INSIDE the iframe wrapper with pointerEvents
             * controlled so it never blocks the panel-toggle button that lives
             * inside the iframe itself.  We simply fade it out; the iframe content
             * (including the toggle) is always interactive beneath it.
             *
             * We use opacity + pointerEvents instead of conditional rendering so
             * there is no layout shift when the overlay disappears.
             */}
            <div style={{
                position:        'absolute',
                inset:           0,
                backgroundColor: 'var(--bg-base)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                zIndex:          10,
                flexDirection:   'column',
                gap:             '14px',
                // Fade out and stop blocking clicks as soon as MAP_READY fires
                opacity:        mapReady ? 0 : 1,
                pointerEvents:  mapReady ? 'none' : 'auto',
                transition:     'opacity 0.4s ease',
            }}>
                <div style={{
                    width:        '36px',
                    height:       '36px',
                    border:       '3px solid var(--border)',
                    borderTop:    '3px solid var(--accent)',
                    borderRadius: '50%',
                    animation:    'spin 0.8s linear infinite',
                }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Loading stations...
                </span>
            </div>

            {/* Reservation confirmation modal — opened when iframe sends OPEN_RESERVATION */}
            {modalOpen && reservationData && (
                <div style={{
                    position:       'fixed',
                    inset:          0,
                    background:     'rgba(0,0,0,0.65)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    zIndex:         1000,
                    left:           '260px',
                }}>
                    <div style={{
                        background:   '#111827',
                        border:       '1px solid #1e2d45',
                        borderRadius: '14px',
                        padding:      '28px',
                        width:        '400px',
                        color:        '#e8f0fe',
                        fontFamily:   'DM Sans, sans-serif',
                        boxShadow:    '0 20px 60px rgba(0,0,0,0.5)',
                        position:     'relative',
                    }}>

                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            style={{
                                position:     'absolute',
                                top:          '14px',
                                right:        '14px',
                                background:   'transparent',
                                border:       'none',
                                color:        '#6b7fa3',
                                fontSize:     '18px',
                                cursor:       'pointer',
                                lineHeight:   1,
                                padding:      '4px',
                                borderRadius: '4px',
                                transition:   'color 0.2s',
                            }}
                            onMouseEnter={e => e.target.style.color = '#e8f0fe'}
                            onMouseLeave={e => e.target.style.color = '#6b7fa3'}
                            title="Close"
                        >
                            ✕
                        </button>

                        {/* Station name and charger summary */}
                        <h3 style={{ marginBottom: '4px', fontSize: '18px', fontWeight: 600, paddingRight: '24px' }}>
                            {reservationData.stationName}
                        </h3>
                        <p style={{ color: '#6b7fa3', fontSize: '13px', marginBottom: '18px' }}>
                            {reservationData.charger.connectorType} · {reservationData.charger.powerOutput} kW · Unit #{reservationData.charger.chargerID || reservationData.charger.id}
                        </p>

                        {/* Reservation time summary — formatLocalTime converts UTC to Istanbul time */}
                        <div style={{
                            background:   'rgba(0,229,255,0.06)',
                            border:       '1px solid rgba(0,229,255,0.2)',
                            borderRadius: '10px',
                            padding:      '14px 16px',
                            marginBottom: '20px',
                            fontSize:     '13px',
                            lineHeight:   '1.9',
                        }}>
                            <div>🕐 Start: <strong>{formatLocalTime(reservationData.startTime)}</strong></div>
                            <div>🕑 End: <strong>{formatLocalTime(reservationData.endTime)}</strong></div>
                            <div>⏱ Duration: <strong>{reservationData.hours} hour(s)</strong></div>
                            <div>💰 Estimated cost: <strong style={{ color: '#00ff9d' }}>{reservationData.estimatedCost}</strong></div>
                        </div>

                        {/* Inline error message */}
                        {errorMsg && (
                            <div style={{
                                background:     '#2d1515',
                                border:         '1px solid #ef4444',
                                borderRadius:   '8px',
                                padding:        '10px 14px',
                                marginBottom:   '16px',
                                fontSize:       '13px',
                                color:          '#ef4444',
                                display:        'flex',
                                justifyContent: 'space-between',
                                alignItems:     'center',
                                gap:            '10px',
                            }}>
                                <span>⚠️ {errorMsg}</span>
                                <button
                                    onClick={() => setErrorMsg('')}
                                    style={{
                                        background: 'none',
                                        border:     'none',
                                        color:      '#ef4444',
                                        cursor:     'pointer',
                                        fontSize:   '16px',
                                        lineHeight: 1,
                                        padding:    '0 2px',
                                        flexShrink: 0,
                                    }}
                                >✕</button>
                            </div>
                        )}

                        {/* Unauthenticated warning */}
                        {!user ? (
                            <p style={{ color: '#ff3b5c', fontSize: '13px', textAlign: 'center', padding: '10px 0' }}>
                                You must be logged in to make a reservation.
                            </p>
                        ) : (
                            <>
                                {/* Show the vehicle pre-selected in the map — no re-selection needed */}
                                {(() => {
                                    const v = vehicles.find(v => String(v.vehicleID) === String(selectedVehicleId));
                                    return v ? (
                                        <div style={{
                                            background:   'rgba(0,255,157,0.06)',
                                            border:       '1px solid rgba(0,255,157,0.2)',
                                            borderRadius: '8px',
                                            padding:      '10px 14px',
                                            marginBottom: '20px',
                                            fontSize:     '13px',
                                            color:        '#00ff9d',
                                        }}>
                                            🚗 {v.brand} {v.model} — {v.plateNumber}
                                        </div>
                                    ) : null;
                                })()}

                                {/* Cancel and confirm buttons */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={closeModal}
                                        style={{
                                            flex:         1,
                                            padding:      '11px',
                                            borderRadius: '8px',
                                            border:       '1px solid #1e2d45',
                                            background:   'transparent',
                                            color:        '#6b7fa3',
                                            cursor:       'pointer',
                                            fontSize:     '13px',
                                            fontFamily:   'DM Sans, sans-serif',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmReservation}
                                        disabled={!selectedVehicleId || submitting}
                                        style={{
                                            flex:         2,
                                            padding:      '11px',
                                            borderRadius: '8px',
                                            border:       'none',
                                            background:   selectedVehicleId && !submitting
                                                ? 'linear-gradient(135deg, #00e5ff, #00ff9d)'
                                                : '#1e2d45',
                                            color:      selectedVehicleId && !submitting ? '#0a0f1e' : '#6b7fa3',
                                            fontWeight: '700',
                                            cursor:     selectedVehicleId && !submitting ? 'pointer' : 'not-allowed',
                                            fontSize:   '13px',
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