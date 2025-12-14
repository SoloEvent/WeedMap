let currentMap = 'satellite';
let scale = 0.5;
let pointX = 0;
let pointY = 0;
let start = { x: 0, y: 0 };
let panning = false;
let markerMode = false;
let markerIdCounter = 1;

// ============================================
// # PUT COORDS HERE FUCKFACE
// ============================================
const permanentMarkers = [
    // Example: { x: 1234, y: 5678, label: "Weed Farm Fuckass" },
    { x: 2355, y: 3780, label: "Weed Location #1" },
    { x: 6137, y: 3115, label: "Weed Location #2" },
    { x: 2472, y: 3666, label: "Weed Location #3" },
    { x: 4871, y: 5940, label: "Weed Location #4" },
];
// ============================================

const mapViewer = document.getElementById('mapViewer');
const satelliteMap = document.getElementById('satelliteMap');
const loading = document.getElementById('loading');
const satImage = document.getElementById('satImage');
const markersContainer = document.getElementById('markersContainer');
const markerNotice = document.getElementById('markerNotice');
const locationsList = document.getElementById('locationsList');

let loaded = 0;
function imageLoaded() {
    loaded++;
    if (loaded === 1) {
        loading.style.display = 'none';
        satelliteMap.style.display = 'block';
        centerMap();
        loadPermanentMarkers();
        updateLocationsList();
    }
}
satImage.onload = imageLoaded;

function setTransform() {
    const t = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    satelliteMap.style.transform = t;
    markersContainer.style.transform = t;
}

function centerMap() {
    const rect = mapViewer.getBoundingClientRect();
    pointX = (rect.width - satImage.width * scale) / 2;
    pointY = (rect.height - satImage.height * scale) / 2;
    setTransform();
}

function zoom(delta, mouseX, mouseY) {
    const oldScale = scale;
    scale = Math.min(Math.max(0.5, scale + delta), 4);
    if (scale === oldScale) return;

    const ratio = scale / oldScale;
    pointX = mouseX - ratio * (mouseX - pointX);
    pointY = mouseY - ratio * (mouseY - pointY);

    setTransform();
}

mapViewer.addEventListener('wheel', (e) => {
    e.preventDefault();

    const rect = mapViewer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    zoom(delta, mouseX, mouseY);
}, { passive: false });

mapViewer.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    
    if (markerMode) {
        const rect = mapViewer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const x = (mouseX - pointX) / scale;
        const y = (mouseY - pointY) / scale;
        
        const label = prompt('Enter location name:', 'Weed Location #' + markerIdCounter);
        
        if (label) {
            createMarker(x, y, label, false);
            const coordString = `{ x: ${Math.round(x)}, y: ${Math.round(y)}, label: "${label}" },`;
            
            navigator.clipboard.writeText(coordString).then(() => {
                console.log('✅ Coordinates copied to clipboard!');
                console.log(coordString);
                alert('Coordinates copied! Paste in script.js under "# PUT COORDS HERE" then refresh to see it in the list.');
            }).catch(err => {
                console.log('⚠️ Copy this manually:', coordString);
            });
            
            toggleMarkerMode();
        }
        return;
    }
    
    panning = true;
    start = { x: e.clientX - pointX, y: e.clientY - pointY };
});

mapViewer.addEventListener('mousemove', (e) => {
    if (!panning) return;
    pointX = e.clientX - start.x;
    pointY = e.clientY - start.y;
    setTransform();
});

mapViewer.addEventListener('mouseup', () => panning = false);
mapViewer.addEventListener('mouseleave', () => panning = false);

function toggleMarkerMode() {
    markerMode = !markerMode;
    markerNotice.style.display = markerMode ? 'block' : 'none';
    document.getElementById('markerBtn').classList.toggle('active', markerMode);
    mapViewer.style.cursor = markerMode ? 'crosshair' : 'grab';
}

function createMarker(x, y, label, permanent = false) {
    const m = document.createElement('div');
    m.className = 'marker';
    m.style.left = x + 'px';
    m.style.top = y + 'px';
    m.innerHTML = `<div class="marker-icon">🌿</div><div class="marker-label">${label}</div>`;
    if (!permanent) {
        m.addEventListener('contextmenu', e => {
            e.preventDefault();
            m.remove();
        });
    }
    markersContainer.appendChild(m);
}

function loadPermanentMarkers() {
    permanentMarkers.forEach(m => createMarker(m.x, m.y, m.label, true));
}

function updateLocationsList() {
    locationsList.innerHTML = '';
    
    if (permanentMarkers.length === 0) {
        locationsList.innerHTML = '<div class="no-locations">No locations saved yet</div>';
        return;
    }
    
    permanentMarkers.forEach((marker, index) => {
        const item = document.createElement('div');
        item.className = 'location-item';
        item.textContent = marker.label;
        item.onclick = () => navigateToLocation(marker.x, marker.y);
        locationsList.appendChild(item);
    });
}

function navigateToLocation(x, y) {
    scale = 2.0;
    const rect = mapViewer.getBoundingClientRect();
    pointX = rect.width / 2 - x * scale;
    pointY = rect.height / 2 - y * scale;
    setTransform();
}

function resetView() {
    scale = 0.5;
    centerMap();
}

window.addEventListener('resize', () => {
    centerMap();
});