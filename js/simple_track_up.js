// SIMPLE TRACK UP SYSTEM - Direct, reliable map rotation
// This system provides simple, working Track Up functionality

(function() {
    'use strict';
    
    console.log('🧭 SIMPLE TRACK UP: Initializing...');
    
    let trackUpEnabled = false;
    let currentHeading = 0;
    let headingWatchId = null;
    let lastKnownPosition = null;
    
    // Wait for map to be ready
    function waitForMapAndSetup() {
        if (window.leafletMap) {
            console.log('✅ SIMPLE TRACK UP: Map found, setting up system');
            setupSimpleTrackUp();
        } else {
            console.log('⏳ SIMPLE TRACK UP: Waiting for map...');
            setTimeout(waitForMapAndSetup, 100);
        }
    }
    
    function setupSimpleTrackUp() {
        // Find the Track Up toggle
        const toggle = document.getElementById('track-up-toggle');
        const status = document.getElementById('track-up-status');
        
        if (!toggle || !status) {
            console.log('⏳ SIMPLE TRACK UP: Toggle not found, retrying...');
            setTimeout(setupSimpleTrackUp, 500);
            return;
        }
        
        console.log('✅ SIMPLE TRACK UP: Toggle found, setting up event listener');
        
        // Add event listener for toggle
        toggle.addEventListener('change', function() {
            trackUpEnabled = this.checked;
            console.log(`🧭 SIMPLE TRACK UP: ${trackUpEnabled ? 'ENABLED' : 'DISABLED'}`);
            
            if (trackUpEnabled) {
                startTrackUp();
            } else {
                stopTrackUp();
            }
        });
        
        console.log('✅ SIMPLE TRACK UP: System ready');
    }
    
    function startTrackUp() {
        console.log('🧭 SIMPLE TRACK UP: Starting Track Up mode');
        
        const status = document.getElementById('track-up-status');
        if (status) {
            status.textContent = 'Starting...';
        }
        
        // Start watching position for heading
        if (navigator.geolocation) {
            headingWatchId = navigator.geolocation.watchPosition(
                function(position) {
                    const newHeading = position.coords.heading;
                    const speed = position.coords.speed;
                    
                    console.log(`🧭 SIMPLE TRACK UP: Position update - Heading: ${newHeading}, Speed: ${speed}`);
                    
                    // Method 1: Use GPS heading if available
                    if (newHeading !== null && newHeading !== undefined && !isNaN(newHeading)) {
                        if (speed === null || speed > 0.5) { // Moving
                            currentHeading = newHeading;
                            rotateMap();
                            updateStatus(`Heading: ${Math.round(newHeading)}°`);
                            console.log(`🧭 SIMPLE TRACK UP: Using GPS heading: ${newHeading.toFixed(1)}°`);
                        }
                    } else {
                        // Method 2: Calculate heading from movement
                        if (lastKnownPosition && speed && speed > 1.0) {
                            const deltaLat = position.coords.latitude - lastKnownPosition.latitude;
                            const deltaLng = position.coords.longitude - lastKnownPosition.longitude;
                            
                            if (Math.abs(deltaLat) > 0.0001 || Math.abs(deltaLng) > 0.0001) {
                                const bearing = Math.atan2(deltaLng, deltaLat) * 180 / Math.PI;
                                const normalizedBearing = (bearing + 360) % 360;
                                
                                currentHeading = normalizedBearing;
                                rotateMap();
                                updateStatus(`Calc: ${Math.round(normalizedBearing)}°`);
                                console.log(`🧭 SIMPLE TRACK UP: Calculated heading: ${normalizedBearing.toFixed(1)}°`);
                            }
                        } else {
                            updateStatus('No heading data');
                        }
                    }
                    
                    // Store position for next calculation
                    lastKnownPosition = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                },
                function(error) {
                    console.error('❌ SIMPLE TRACK UP: GPS error:', error);
                    updateStatus('GPS Error');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 5000
                }
            );
        } else {
            updateStatus('GPS not supported');
        }
    }
    
    function stopTrackUp() {
        console.log('🧭 SIMPLE TRACK UP: Stopping Track Up mode');
        
        // Stop watching position
        if (headingWatchId) {
            navigator.geolocation.clearWatch(headingWatchId);
            headingWatchId = null;
        }
        
        // Reset map rotation
        resetMapRotation();
        updateStatus('North Up');
    }
    
    function rotateMap() {
        if (!window.leafletMap || !trackUpEnabled) return;
        
        try {
            const mapContainer = window.leafletMap.getContainer();
            if (!mapContainer) return;
            
            // Simple rotation - rotate map opposite to heading so heading points up
            const rotationAngle = -currentHeading;
            
            console.log(`🧭 SIMPLE TRACK UP: Rotating map to ${rotationAngle.toFixed(1)}°`);
            
            // INCREASED scaling to eliminate white corners completely
            const scale = 1.5; // Increased from 1.1 to 1.5 to cover all corners
            
            // Apply rotation with increased scaling
            mapContainer.style.transform = `rotate(${rotationAngle}deg) scale(${scale})`;
            mapContainer.style.transformOrigin = 'center center';
            mapContainer.style.transition = 'transform 0.5s ease-out';
            
            // Ensure no overflow issues
            mapContainer.style.overflow = 'hidden';
            
            // Counter-rotate controls to keep them readable
            const controls = document.querySelectorAll('.leaflet-control-zoom, .leaflet-control-attribution');
            controls.forEach(control => {
                control.style.transform = `rotate(${currentHeading}deg) scale(${1/scale})`;
                control.style.transformOrigin = 'center center';
            });
            
        } catch (error) {
            console.error('❌ SIMPLE TRACK UP: Error rotating map:', error);
        }
    }
    
    function resetMapRotation() {
        try {
            const mapContainer = window.leafletMap.getContainer();
            if (mapContainer) {
                mapContainer.style.transform = 'none';
                mapContainer.style.transition = 'transform 0.5s ease-out';
            }
            
            // Reset controls
            const controls = document.querySelectorAll('.leaflet-control-zoom, .leaflet-control-attribution');
            controls.forEach(control => {
                control.style.transform = 'none';
            });
            
            console.log('✅ SIMPLE TRACK UP: Map rotation reset');
        } catch (error) {
            console.error('❌ SIMPLE TRACK UP: Error resetting rotation:', error);
        }
    }
    
    function updateStatus(text) {
        const status = document.getElementById('track-up-status');
        if (status) {
            status.textContent = text;
        }
    }
    
    // Start the system when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForMapAndSetup);
    } else {
        waitForMapAndSetup();
    }
    
})();

