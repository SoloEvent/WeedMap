let currentMap = 'satellite';
let scale = 1;
let panning = false;
let pointX = 0;
let pointY = 0;
let start = { x: 0, y: 0 };
let markerMode = false;
let markerIdCounter = 1;

// PERMANENT MARKERS - Edit this array to add/remove weed locations
const permanentMarkers = [
    // # PUT COORDS HERE
    // Example: { x: 500, y: 600, label: "Weed Farm #1" },
    // Copy coordinates from console and paste below:
    
];

const mapViewer = document.getElementById('mapViewer');
const satelliteMap = document.getElementById('satelliteMap');
const atlasMap = document.getElementById('atlasMap');
const loading = document.getElementById('loading');
const satImage = document.getElementById('satImage');
const atlasImage = document.getElementById('atlasImage');
const markersContainer = document.getElementById('markersContainer');
const markerNotice = document.getElementById('markerNotice');

// Image loading
let imagesLoaded = 0;
const totalImages = 2;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        loading.style.display = 'none';
        satelliteMap.style.display = 'block';
        centerMap();
        loadPermanentMarkers();
    }
}

satImage.onload = imageLoaded;
atlasImage.onload = imageLoaded;

satImage.onerror = () => {
    loading.innerHTML = '<div>Error loading satellite map.<br>Please check your internet connection.</div>';
};

atlasImage.onerror = () => {
    loading.innerHTML = '<div>Error loading atlas map.<br>Please check your internet connection.</div>';
};

function switchMap(mapType) {
    currentMap = mapType;
    
    if (mapType === 'satellite') {
        satelliteMap.style.opacity = '1';
        atlasMap.style.opacity = '0';
        setTimeout(() => {
            satelliteMap.style.display = 'block';
            atlasMap.style.display = 'none';
        }, 300);
        document.getElementById('satelliteBtn').classList.add('active');
        document.getElementById('atlasBtn').classList.remove('active');
    } else {
        atlasMap.style.opacity = '1';
        satelliteMap.style.opacity = '0';
        setTimeout(() => {
            atlasMap.style.display = 'block';
            satelliteMap.style.display = 'none';
        }, 300);
        document.getElementById('atlasBtn').classList.add('active');
        document.getElementById('satelliteBtn').classList.remove('active');
    }
}

function setTransform() {
    satelliteMap.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    atlasMap.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    markersContainer.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
}

function centerMap() {
    const img = currentMap === 'satellite' ? satImage : atlasImage;
    const viewerRect = mapViewer.getBoundingClientRect();
    
    pointX = (viewerRect.width - img.width * scale) / 2;
    pointY = (viewerRect.height - img.height * scale) / 2;
    
    setTransform();
}

function zoom(delta, mouseX, mouseY) {
    const oldScale = scale;
    scale += delta;
    scale = Math.min(Math.max(0.5, scale), 4);
    
    if (scale === oldScale) return;
    
    const scaleChange = scale / oldScale;
    
    if (mouseX !== undefined && mouseY !== undefined) {
        pointX = mouseX - (mouseX - pointX) * scaleChange;
        pointY = mouseY - (mouseY - pointY) * scaleChange;
    } else {
        const viewerRect = mapViewer.getBoundingClientRect();
        const centerX = viewerRect.width / 2;
        const centerY = viewerRect.height / 2;
        
        pointX = centerX - (centerX - pointX) * scaleChange;
        pointY = centerY - (centerY - pointY) * scaleChange;
    }
    
    setTransform();
}

function resetView() {
    scale = 0.5;
    centerMap();
}

function toggleMarkerMode() {
    markerMode = !markerMode;
    const markerBtn = document.getElementById('markerBtn');
    
    if (markerMode) {
        markerBtn.classList.add('active');
        markerNotice.style.display = 'block';
        mapViewer.style.cursor = 'crosshair';
    } else {
        markerBtn.classList.remove('active');
        markerNotice.style.display = 'none';
        mapViewer.style.cursor = 'grab';
    }
}

function createMarker(x, y, label, isPermanent = false) {
    const marker = document.createElement('div');
    marker.className = 'marker';
    marker.style.left = x + 'px';
    marker.style.top = y + 'px';
    
    if (!isPermanent) {
        marker.id = 'temp-marker-' + markerIdCounter++;
    }
    
    marker.innerHTML = `
        <div class="marker-icon">🌿</div>
        <div class="marker-label">${label}</div>
    `;
    
    if (!isPermanent) {
        marker.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            marker.remove();
            console.log('Temporary marker removed');
        });
    }
    
    marker.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`Marker "${label}" at coordinates: { x: ${Math.round(x)}, y: ${Math.round(y)}, label: "${label}" }`);
        console.log('Copy this line to permanentMarkers array to make it permanent!');
    });
    
    markersContainer.appendChild(marker);
    return marker;
}

function loadPermanentMarkers() {
    permanentMarkers.forEach(markerData => {
        createMarker(markerData.x, markerData.y, markerData.label, true);
    });
}

function getMapCoordinates(clientX, clientY) {
    const img = currentMap === 'satellite' ? satImage : atlasImage;
    const viewerRect = mapViewer.getBoundingClientRect();
    
    // Calculate the actual position on the original image
    const x = (clientX - viewerRect.left - pointX) / scale;
    const y = (clientY - viewerRect.top - pointY) / scale;
    
    return { x, y };
}

// Mouse events
mapViewer.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only left click
    
    // If in marker mode, place a marker
    if (markerMode) {
        const coords = getMapCoordinates(e.clientX, e.clientY);
        const label = prompt('Enter location name:', 'Weed Location #' + markerIdCounter);
        
        if (label) {
            createMarker(coords.x, coords.y, label, false);
            const coordString = `{ x: ${Math.round(coords.x)}, y: ${Math.round(coords.y)}, label: "${label}" },`;
            console.log(`Add this to permanentMarkers array: ${coordString}`);
            
            // Copy to clipboard
            navigator.clipboard.writeText(coordString).then(() => {
                console.log('✅ Coordinates copied to clipboard!');
                alert('Coordinates copied to clipboard! Paste them in script.js under "# PUT COORDS HERE"');
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
            
            // Auto-untoggle marker mode
            toggleMarkerMode();
        }
        return;
    }
    
    e.preventDefault();
    start = { x: e.clientX - pointX, y: e.clientY - pointY };
    panning = true;
});

mapViewer.addEventListener('mousemove', (e) => {
    if (!panning) return;
    e.preventDefault();
    
    pointX = e.clientX - start.x;
    pointY = e.clientY - start.y;
    setTransform();
});

mapViewer.addEventListener('mouseup', () => {
    panning = false;
    mapViewer.style.cursor = markerMode ? 'crosshair' : 'grab';
});

mapViewer.addEventListener('mouseleave', () => {
    panning = false;
    mapViewer.style.cursor = markerMode ? 'crosshair' : 'grab';
});

// Touch events for mobile
mapViewer.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    start = { x: touch.clientX - pointX, y: touch.clientY - pointY };
    panning = true;
});

mapViewer.addEventListener('touchmove', (e) => {
    if (!panning) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    pointX = touch.clientX - start.x;
    pointY = touch.clientY - start.y;
    setTransform();
});

mapViewer.addEventListener('touchend', () => {
    panning = false;
});

// Mouse wheel zoom - ONLY ZOOM, NO SCROLLING
window.addEventListener('wheel', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    zoom(delta, e.clientX, e.clientY);
}, { passive: false });

// Keyboard shortcuts (removed zoom shortcuts, only map switching and reset)
document.addEventListener('keydown', (e) => {
    if (e.key === '0') {
        resetView();
    } else if (e.key === '1') {
        switchMap('satellite');
    } else if (e.key === '2') {
        switchMap('atlas');
    }
});

// Window resize
window.addEventListener('resize', () => {
    centerMap();
});
