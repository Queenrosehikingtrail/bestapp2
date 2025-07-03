// Track Up / Heading Up Mode Functionality
(function() {
    'use strict';
    
    let trackUpMode = false;
    let currentHeading = 0;
    let mapRotationEnabled = false;
    let trackUpButton = null;
    let trackUpStatusElement = null;
    let watchId = null;
    let lastValidHeading = 0;
    let headingUpdateInterval = null;
    
    // Initialize Track Up functionality when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🧭 Track Up: Starting initialization...');
        initializeTrackUpMode();
    });
    
    function initializeTrackUpMode() {
        // Wait for map to be ready
        const checkMapReady = () => {
            if (window.leafletMap && typeof window.leafletMap === 'object') {
                console.log('✅ Track Up: Map found, setting up Track Up mode...');
                setupTrackUpControls();
                setupHeadingTracking();
            } else {
                console.log('⏳ Track Up: Waiting for map...');
                setTimeout(checkMapReady, 1000);
            }
        };
        checkMapReady();
    }
    
    function setupTrackUpControls() {
        try {
            // Find the track-up-container-compact in the new layout
            const trackUpContainer = document.querySelector('.track-up-container-compact');
            if (!trackUpContainer) {
                console.error('❌ Track Up: Container not found in compact layout');
                return;
            }
            
            // Find the toggle input and status span
            const toggleInput = document.getElementById('track-up-toggle');
            const statusSpan = document.getElementById('track-up-status');
            
            if (!toggleInput || !statusSpan) {
                console.error('❌ Track Up: Toggle input or status span not found');
                return;
            }
            
            // Add event listener
            toggleInput.addEventListener('change', function() {
                trackUpMode = this.checked;
                updateTrackUpMode();
                console.log(`🧭 Track Up: Mode ${trackUpMode ? 'enabled' : 'disabled'}`);
            });
            
            trackUpButton = toggleInput;
            trackUpStatusElement = statusSpan;
            console.log('✅ Track Up: Controls setup successfully with compact layout');
            
        } catch (error) {
            console.error('❌ Track Up: Error setting up controls:', error);
        }
    }
    
    function setupHeadingTracking() {
        if (!navigator.geolocation) {
            console.error('❌ Track Up: Geolocation not supported');
            return;
        }
        
        console.log('🧭 Track Up: Setting up IMPROVED heading tracking');
        
        // Enhanced geolocation options for better heading accuracy
        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 2000
        };
        
        // Start watching position for continuous heading updates
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                let newHeading = currentHeading;
                const speed = position.coords.speed;
                const heading = position.coords.heading;
                
                console.log(`🧭 Track Up: Position update - Heading: ${heading}, Speed: ${speed}, Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`);
                
                // Method 1: Use GPS heading if available
                if (heading !== null && typeof heading === 'number' && !isNaN(heading)) {
                    if (speed === null || speed > 0.3) { // Lower threshold: 0.3 m/s for movement
                        newHeading = heading;
                        lastValidHeading = heading;
                        console.log(`🧭 Track Up: Using GPS heading: ${heading.toFixed(1)}°`);
                    }
                } else {
                    // Method 2: Calculate heading from movement if GPS heading not available
                    if (lastPosition && (speed === null || speed > 0.5)) {
                        const deltaLat = position.coords.latitude - lastPosition.latitude;
                        const deltaLng = position.coords.longitude - lastPosition.longitude;
                        
                        // Check if there's significant movement
                        if (Math.abs(deltaLat) > 0.00001 || Math.abs(deltaLng) > 0.00001) {
                            // Calculate bearing from movement (in degrees)
                            const bearing = Math.atan2(
                                Math.sin(deltaLng * Math.PI / 180) * Math.cos(position.coords.latitude * Math.PI / 180),
                                Math.cos(lastPosition.latitude * Math.PI / 180) * Math.sin(position.coords.latitude * Math.PI / 180) -
                                Math.sin(lastPosition.latitude * Math.PI / 180) * Math.cos(position.coords.latitude * Math.PI / 180) * Math.cos(deltaLng * Math.PI / 180)
                            ) * 180 / Math.PI;
                            
                            newHeading = (bearing + 360) % 360; // Normalize to 0-360
                            lastValidHeading = newHeading;
                            console.log(`🧭 Track Up: Calculated heading from movement: ${newHeading.toFixed(1)}°`);
                        }
                    } else if (lastValidHeading !== null) {
                        // Method 3: Use last valid heading if no new data
                        newHeading = lastValidHeading;
                        console.log(`🧭 Track Up: Using last valid heading: ${newHeading.toFixed(1)}°`);
                    }
                }
                
                // Update heading if it changed significantly (reduce jitter)
                if (Math.abs(newHeading - currentHeading) > 3) { // 3 degree threshold
                    currentHeading = newHeading;
                    
                    if (trackUpMode) {
                        updateMapRotation();
                        updateTrackUpStatus(`Heading: ${currentHeading.toFixed(0)}°`);
                    }
                }
                
                // Store position for next calculation
                lastPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    timestamp: Date.now()
                };
            },
            (error) => {
                console.error('❌ Track Up: Geolocation error:', error);
                updateTrackUpStatus('GPS Error');
            },
            options
        );
        
        // Additional: Try device orientation as backup for heading
        if (window.DeviceOrientationEvent) {
            console.log('🧭 Track Up: Setting up device orientation backup');
            window.addEventListener('deviceorientation', function(event) {
                if (trackUpMode && event.alpha !== null && currentHeading === 0) {
                    // Use compass heading only if GPS heading is not available
                    let compassHeading = event.alpha;
                    // Convert to standard bearing (0° = North, clockwise)
                    compassHeading = (360 - compassHeading) % 360;
                    currentHeading = compassHeading;
                    updateMapRotation();
                    console.log(`🧭 Track Up: Using compass heading: ${compassHeading.toFixed(1)}°`);
                }
            });
        }
        
        console.log('✅ Track Up: Improved heading tracking started');
    }
    
    function updateMapRotation() {
        if (!window.leafletMap || !trackUpMode) return;
        
        try {
            // IMPROVED: Better rotation logic for Track Up mode
            // In Track Up mode, the map should rotate so the user's direction of travel points up
            const rotationAngle = -currentHeading; // Negative to rotate map opposite to heading
            
            const mapContainer = window.leafletMap.getContainer();
            if (mapContainer) {
                console.log(`🧭 Track Up: Applying IMPROVED rotation ${rotationAngle.toFixed(1)}° (heading: ${currentHeading.toFixed(1)}°)`);
                
                // CONSERVATIVE scaling - just enough to cover corners
                const scale = 1.1; // Increased slightly from 1.05 to 1.1 for better coverage
                
                // Apply rotation with proper transform origin
                mapContainer.style.transform = `rotate(${rotationAngle}deg) scale(${scale})`;
                mapContainer.style.transformOrigin = 'center center';
                mapContainer.style.transition = 'transform 0.5s ease-out'; // Smoother transition
                
                // Ensure map container has proper styling
                mapContainer.style.background = 'transparent';
                mapContainer.style.position = 'relative';
                
                // Ensure parent container allows the rotation
                const mapParent = mapContainer.parentElement;
                if (mapParent) {
                    mapParent.style.background = 'transparent';
                    mapParent.style.overflow = 'hidden';
                    mapParent.style.position = 'relative';
                }
                
                // Counter-rotate UI elements to keep them readable
                const elementsToCounterRotate = [
                    '.leaflet-control-zoom',
                    '.leaflet-control-attribution',
                    '.custom-location-indicator',
                    '.leaflet-marker-icon'
                ];
                
                elementsToCounterRotate.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                        // Counter-rotate to keep elements upright
                        element.style.transform = `rotate(${-rotationAngle}deg) scale(${1/scale})`;
                        element.style.transformOrigin = 'center center';
                        element.style.transition = 'transform 0.5s ease-out';
                    });
                });
                
                console.log(`✅ Track Up: Improved rotation applied successfully`);
            }
        } catch (error) {
            console.error('❌ Track Up: Error updating map rotation:', error);
        }
    }
    
    function updateUIElementsRotation(counterRotation, counterScale = 1) {
        // Counter-rotate UI elements so they remain readable
        const elementsToCounterRotate = [
            '.leaflet-control',
            '.leaflet-popup'
        ];
        
        elementsToCounterRotate.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element) {
                    element.style.transform = `rotate(${counterRotation}deg) scale(${counterScale})`;
                    element.style.transformOrigin = 'center center';
                }
            });
        });
        
        // FIXED: Protect custom location indicator from rotation and scaling effects
        const customIndicators = document.querySelectorAll('.custom-location-indicator, .custom-user-location');
        customIndicators.forEach(indicator => {
            if (indicator) {
                // Ensure the custom indicator stays visible and at normal size
                indicator.style.visibility = 'visible !important';
                indicator.style.opacity = '1 !important';
                indicator.style.display = 'block !important';
                indicator.style.zIndex = '1000 !important';
                // CRITICAL: Don't apply any rotation or scaling to custom indicators
                indicator.style.transform = 'none !important';
                indicator.style.transformOrigin = 'center center !important';
                // Ensure parent marker container also doesn't get scaled
                if (indicator.parentElement) {
                    indicator.parentElement.style.transform = 'none !important';
                }
            }
        });
        
        // Also protect the marker containers themselves
        const markerContainers = document.querySelectorAll('.leaflet-marker-pane .leaflet-marker-icon.custom-location-indicator');
        markerContainers.forEach(container => {
            if (container && container.parentElement) {
                container.parentElement.style.transform = 'none !important';
            }
        });
        
        // Ensure Track Up controls remain visible and unrotated
        const trackUpContainer = document.querySelector('.track-up-container-compact');
        if (trackUpContainer) {
            trackUpContainer.style.transform = 'none';
        }
        
        // Ensure main controls container remains visible
        const controlsContainer = document.querySelector('.controls-compact');
        if (controlsContainer) {
            controlsContainer.style.transform = 'none';
        }
    }
    
    function removeDefaultLocationMarkers() {
        // SUPER AGGRESSIVE: Remove all default location markers
        try {
            // Remove by class names
            const defaultMarkers = document.querySelectorAll('.leaflet-marker-icon:not(.custom-location-indicator):not(.custom-user-location)');
            defaultMarkers.forEach(marker => {
                if (marker && marker.parentNode) {
                    marker.parentNode.removeChild(marker);
                    console.log('🗑️ Track Up: Removed default marker');
                }
            });
            
            // Remove by src attributes (yellow arrows, default icons)
            const imageMarkers = document.querySelectorAll('img.leaflet-marker-icon');
            imageMarkers.forEach(marker => {
                const src = marker.src || '';
                if (src.includes('marker-icon') || src.includes('yellow') || src.includes('arrow') || src.includes('location')) {
                    if (marker.parentNode) {
                        marker.parentNode.removeChild(marker);
                        console.log('🗑️ Track Up: Removed image marker with src:', src);
                    }
                }
            });
            
            // Remove marker shadows
            const shadows = document.querySelectorAll('.leaflet-marker-shadow');
            shadows.forEach(shadow => {
                if (shadow && shadow.parentNode) {
                    shadow.parentNode.removeChild(shadow);
                }
            });
            
            // Force hide any remaining markers via CSS
            const allMarkers = document.querySelectorAll('.leaflet-marker-icon');
            allMarkers.forEach(marker => {
                if (!marker.classList.contains('custom-location-indicator') && 
                    !marker.classList.contains('custom-user-location')) {
                    marker.style.display = 'none';
                    marker.style.visibility = 'hidden';
                    marker.style.opacity = '0';
                }
            });
            
        } catch (error) {
            console.error('❌ Track Up: Error removing default markers:', error);
        }
    }
    
    function updateTrackUpMode() {
        if (trackUpMode) {
            updateTrackUpStatus('Track Up Active');
            mapRotationEnabled = true;
            
            // AGGRESSIVE: Remove any default location markers immediately
            removeDefaultLocationMarkers();
            
            // Start continuous heading updates
            if (!headingUpdateInterval) {
                headingUpdateInterval = setInterval(() => {
                    if (trackUpMode && currentHeading !== null) {
                        updateMapRotation();
                        // Periodically remove default markers that might appear
                        removeDefaultLocationMarkers();
                    }
                }, 1000); // Update every second
            }
            
            // Apply current rotation immediately
            updateMapRotation();
        } else {
            updateTrackUpStatus('North Up');
            mapRotationEnabled = false;
            
            // Stop continuous updates
            if (headingUpdateInterval) {
                clearInterval(headingUpdateInterval);
                headingUpdateInterval = null;
            }
            
            // Reset map rotation
            resetMapRotation();
        }
    }
    
    function resetMapRotation() {
        try {
            if (window.leafletMap) {
                const mapContainer = window.leafletMap.getContainer();
                if (mapContainer) {
                    mapContainer.style.transform = 'none';
                    
                    // Reset the parent container styling
                    const mapParent = mapContainer.parentElement;
                    if (mapParent) {
                        mapParent.style.overflow = '';
                        mapParent.style.position = '';
                        mapParent.style.zIndex = '';
                        mapParent.style.backgroundColor = ''; // Reset background color
                    }
                    
                    // Reset UI elements rotation and scaling
                    updateUIElementsRotation(0, 1);
                    
                    console.log('🧭 Track Up: Map rotation reset to North Up');
                }
            }
        } catch (error) {
            console.error('❌ Track Up: Error resetting map rotation:', error);
        }
    }
    
    function updateTrackUpStatus(status) {
        const statusElement = document.getElementById('track-up-status');
        if (statusElement) {
            statusElement.textContent = status;
            
            // Add visual feedback
            if (status === 'Track Up Active') {
                statusElement.style.color = '#2196F3';
                statusElement.style.fontWeight = 'bold';
            } else if (status === 'GPS Error') {
                statusElement.style.color = '#f44336';
                statusElement.style.fontWeight = 'normal';
            } else {
                statusElement.style.color = '#666';
                statusElement.style.fontWeight = 'normal';
            }
        }
    }
    
    // Cleanup function
    function cleanup() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        
        if (headingUpdateInterval) {
            clearInterval(headingUpdateInterval);
            headingUpdateInterval = null;
        }
        
        resetMapRotation();
    }
    
    // Expose functions globally for debugging
    window.TrackUpMode = {
        toggle: () => {
            if (trackUpButton) {
                trackUpButton.checked = !trackUpButton.checked;
                trackUpMode = trackUpButton.checked;
                updateTrackUpMode();
            }
        },
        isEnabled: () => trackUpMode,
        getCurrentHeading: () => currentHeading,
        cleanup: cleanup
    };
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
    console.log('✅ Track Up: Module loaded successfully');
})();

