// DIRECT GPS SYSTEM - Complete override of all location functionality
// This system bypasses all existing location code and provides direct GPS control

(function() {
    'use strict';
    
    console.log('🚀 DIRECT GPS SYSTEM: Initializing...');
    
    let userLocationMarker = null;
    let isTrackingLocation = false;
    let currentUserPosition = null;
    
    // Wait for map to be ready
    function waitForMap() {
        if (window.leafletMap) {
            console.log('✅ DIRECT GPS: Map found, setting up system');
            setupDirectGPS();
        } else {
            console.log('⏳ DIRECT GPS: Waiting for map...');
            setTimeout(waitForMap, 100);
        }
    }
    
    function setupDirectGPS() {
        // COMPLETELY OVERRIDE the existing trackUserLocation function
        window.trackUserLocation = function() {
            console.log('🎯 DIRECT GPS: Taking complete control of location tracking');
            
            const btn = document.getElementById('track-location-btn');
            if (btn) {
                btn.textContent = 'Getting GPS...';
                btn.disabled = true;
            }
            
            // Clear any existing markers
            if (userLocationMarker) {
                window.leafletMap.removeLayer(userLocationMarker);
                userLocationMarker = null;
            }
            
            // Get GPS position with aggressive settings
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const accuracy = position.coords.accuracy;
                        
                        console.log(`🎯 DIRECT GPS: SUCCESS! Position found:`);
                        console.log(`   Latitude: ${lat}`);
                        console.log(`   Longitude: ${lng}`);
                        console.log(`   Accuracy: ${accuracy}m`);
                        
                        // Store the position for Track Up system
                        currentUserPosition = { lat, lng, accuracy };
                        
                        // Center map on user location FIRST
                        window.leafletMap.setView([lat, lng], 16);
                        
                        // Wait a moment for map to settle, then create marker
                        setTimeout(() => {
                            // Create bright red location marker with Android-specific fixes
                            userLocationMarker = L.circleMarker([lat, lng], {
                                color: '#FF0000',
                                fillColor: '#FF0000',
                                fillOpacity: 0.8,
                                radius: 8,
                                weight: 3,
                                // Android-specific positioning fixes
                                pane: 'markerPane', // Ensure correct pane
                                interactive: true,
                                bubblingMouseEvents: false
                            }).addTo(window.leafletMap);
                            
                            // Force marker positioning for Android
                            if (userLocationMarker._icon) {
                                userLocationMarker._icon.style.position = 'absolute';
                                userLocationMarker._icon.style.zIndex = '1000';
                                userLocationMarker._icon.style.pointerEvents = 'auto';
                            }
                            
                            // Add popup with Android-friendly options
                            userLocationMarker.bindPopup(`📍 Your Location<br>Accuracy: ${accuracy.toFixed(0)}m`, {
                                offset: [0, -10],
                                closeButton: true,
                                autoClose: false,
                                closeOnClick: false
                            }).openPopup();
                            
                            console.log('✅ DIRECT GPS: Android-optimized red marker created and positioned');
                            
                            // Force map refresh to ensure marker appears correctly
                            setTimeout(() => {
                                window.leafletMap.invalidateSize();
                            }, 100);
                            
                        }, 200); // Give map time to center before adding marker
                        
                        if (btn) {
                            btn.textContent = '📍 Where Am I';
                            btn.disabled = false;
                        }
                        
                        isTrackingLocation = true;
                    },
                    function(error) {
                        console.error('❌ DIRECT GPS: Error getting location:', error);
                        
                        // Show error message
                        alert(`GPS Error: ${error.message}\n\nPlease:\n1. Enable location services\n2. Allow location access for this website\n3. Try again`);
                        
                        if (btn) {
                            btn.textContent = '📍 Where Am I';
                            btn.disabled = false;
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 20000,  // 20 seconds
                        maximumAge: 0    // Always get fresh location
                    }
                );
            } else {
                console.error('❌ DIRECT GPS: Geolocation not supported');
                alert('GPS not supported on this device');
                
                if (btn) {
                    btn.textContent = '📍 Where Am I';
                    btn.disabled = false;
                }
            }
        };
        
        console.log('✅ DIRECT GPS: System ready - trackUserLocation function overridden');
    }
    
    // Get current user position for Track Up mode
    window.getCurrentUserPosition = function() {
        return currentUserPosition;
    };
    
    // Check if user location is being tracked
    window.isUserLocationTracked = function() {
        return isTrackingLocation && currentUserPosition !== null;
    };
    
    // Start the system when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForMap);
    } else {
        waitForMap();
    }
    
})();

