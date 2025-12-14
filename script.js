let currentMap = 'satellite';
let scale = 0.5;
let pointX = 0;
let pointY = 0;
let start = { x: 0, y: 0 };
let panning = false;
let markerMode = false;
let markerIdCounter = 1;

// ============================================
// # PUT COORDS HERE (paste between the brackets)
// ============================================
const permanentMarkers = [
    // Example: { x: 1234, y: 5678, label: "Weed Farm North" },
    { x: 2372, y: 3791, label: "Weed Location #1" },
];
// ============================================

const mapViewer = document.getElementById('mapViewer');
const satelliteMap = document.getElementById('satelliteMap');
const atlasMap = document.getElementById('atlasMap');
const loading = document.getElementById('loading');
const satImage = document.getElementById('satImage');
const atlasImage = document.getElementById('atlasImage');
const markersContainer = document.getElementById('markersContainer');
const markerNotice = document.getElementById('markerNotice');

/* ---------- IMAGE LOAD ---------- */
let loaded = 0;
function imageLoaded() {
    loaded++;
    if (loaded === 2) {
        loading.style.display = 'none';
        satelliteMap.style.display = 'block';
        centerMap();
        loadPermanentMarkers();
    }
}
satImage.onload = imageLoaded;
atlasImage.onload = imageLoaded;

/* ---------- MAP SWITCH ---------- */
function switchMap(type) {
    currentMap = type;
    satelliteMap.style.display = type === 'satellite' ? 'block' : 'none';
    atlasMap.style.display = type === 'atlas' ? 'block' : 'none';
    
    // Update button states
    document.getElementById('satelliteBtn').classList.toggle('active', type === 'satellite');
    document.getElementById('atlasBtn').classList.toggle('active', type === 'atlas');
}

/* ---------- TRANSFORM ---------- */
function setTransform() {
    const t = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    satelliteMap.style.transform = t;
    atlasMap.style.transform = t;
    markersContainer.style.transform = t;
}

/* ---------- CENTER ---------- */
function centerMap() {
    const img = currentMap === 'satellite' ? satImage : atlasImage;
    const rect = mapViewer.getBoundingClientRect();

    pointX = (rect.width - img.width * scale) / 2;
    pointY = (rect.height - img.height * scale) / 2;
    setTransform();
}

/* ---------- PERFECT ZOOM ---------- */
function zoom(delta, mouseX, mouseY) {
    const oldScale = scale;
    scale = Math.min(Math.max(0.5, scale + delta), 4);
    if (scale === oldScale) return;

    const ratio = scale / oldScale;

    pointX = mouseX - ratio * (mouseX - pointX);
    pointY = mouseY - ratio * (mouseY - pointY);

    setTransform();
}

/* ---------- WHEEL (FIXED) ---------- */
mapViewer.addEventListener('wheel', (e) => {
    e.preventDefault();

    const rect = mapViewer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    zoom(delta, mouseX, mouseY);
}, { passive: false });

/* ---------- PAN ---------- */
mapViewer.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only left click
    
    // If in marker mode, place a marker
    if (markerMode) {
        const rect = mapViewer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate actual coordinates on the image
        const x = (mouseX - pointX) / scale;
        const y = (mouseY - pointY) / scale;
        
        const label = prompt('Enter location name:', 'Weed Location #' + markerIdCounter);
        
        if (label) {
            createMarker(x, y, label, false);
            const coordString = `{ x: ${Math.round(x)}, y: ${Math.round(y)}, label: "${label}" },`;
            
            // Copy to clipboard
            navigator.clipboard.writeText(coordString).then(() => {
                console.log('✅ Coordinates copied to clipboard!');
                console.log(coordString);
                alert('Coordinates copied! Paste in script.js under "# PUT COORDS HERE"');
            }).catch(err => {
                console.log('⚠️ Copy this manually:', coordString);
            });
            
            // Auto-untoggle marker mode
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

/* ---------- MARKERS ---------- */
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

/* ---------- RESET ---------- */
function resetView() {
    scale = 0.5;
    centerMap();
}