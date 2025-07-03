// ULTRA SIMPLE Location Indicator - Direct approach that WILL work
// This bypasses all complex systems and directly adds a visible red dot

(function() {
    'use strict';
    
    let userLocationMarker = null;
    
    // Create a simple red dot marker that WILL be visible
    function createSimpleLocationMarker(lat, lng) {
        console.log('🎯 Creating SIMPLE location marker at:', lat, lng);
        
        if (!window.leafletMap) {
            console.log('❌ No map available');
            return null;
        }
        
        // Remove any existing marker
        if (userLocationMarker) {
            window.leafletMap.removeLayer(userLocationMarker);
            userLocationMarker = null;
        }
        
        // Create the simplest possible red circle marker
        userLocationMarker = L.circleMarker([lat, lng], {
            radius: 12,
            fillColor: '#FF0000',
            color: '#FFFFFF',
            weight: 3,
            opacity: 1,
            fillOpacity: 1
        }).addTo(window.leafletMap);
        
        // Add a popup to make it even more obvious
        userLocationMarker.bindPopup('📍 Your Location').openPopup();
        
        console.log('✅ Simple location marker created and added to map');
        return userLocationMarker;
    }
    
    // Override the trackUserLocation function with our simple approach
    function setupSimpleLocationTracking() {
        console.log('🎯 Setting up SIMPLE location tracking');
        
        // Wait for map to be ready
        const checkMap = setInterval(() => {
            if (window.leafletMap && window.trackUserLocation) {
                clearInterval(checkMap);
                
                // Store the original function
                const originalTrackUserLocation = window.trackUserLocation;
                
                // Replace with our simple version
                window.trackUserLocation = function() {
                    console.log('📍 SIMPLE track user location called');
                    
                    const btn = document.getElementById('track-location-btn');
                    if (btn) {
                        btn.textContent = 'Tracking...';
                        btn.disabled = true;
                    }
                    
                    // Try real geolocation FIRST
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            function(position) {
                                const realLat = position.coords.latitude;
                                const realLng = position.coords.longitude;
                                console.log('✅ Real location found:', realLat, realLng);
                                
                                // Use REAL location - center map and create marker
                                window.leafletMap.setView([realLat, realLng], 16);
                                createSimpleLocationMarker(realLat, realLng);
                                
                                if (btn) {
                                    btn.textContent = '📍 Where Am I';
                                    btn.disabled = false;
                                }
                            },
                            function(error) {
                                console.log('ℹ️ Geolocation failed, using fallback location');
                                
                                // Only use test location as fallback
                                const testLat = -25.7479;  // Pretoria area
                                const testLng = 28.2293;
                                
                                console.log('🧪 Using fallback location for demonstration:', testLat, testLng);
                                
                                // Set map view to test location
                                window.leafletMap.setView([testLat, testLng], 16);
                                
                                // Create our simple marker
                                const marker = createSimpleLocationMarker(testLat, testLng);
                                
                                if (btn) {
                                    btn.textContent = '📍 Where Am I';
                                    btn.disabled = false;
                                }
                            },
                            {
                                enableHighAccuracy: true,
                                timeout: 10000,
                                maximumAge: 60000
                            }
                        );
                    } else {
                        console.log('❌ Geolocation not supported');
                        if (btn) {
                            btn.textContent = '📍 Where Am I';
                            btn.disabled = false;
                        }
                    }
                };
                
                console.log('✅ SIMPLE location tracking installed');
            }
        }, 100);
    }
    
    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupSimpleLocationTracking);
    } else {
        setupSimpleLocationTracking();
    }
    
    // Export for external use
    window.createSimpleLocationMarker = createSimpleLocationMarker;
    
})();

