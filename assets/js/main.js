/* jshint esversion: 6 */

let map;
const markers = {};
let selectedId = null;
let priceMin = 0;
let priceMax = Infinity;
let maxPrice = 100;
let activeCuisines = new Set();

// ── Helpers ──────────────────────────────────────────────────────────────────

function avgCost(r) {
  const totalCost   = r.visits.reduce((s, v) => s + v.cost,   0);
  const totalPeople = r.visits.reduce((s, v) => s + v.people, 0);
  return totalCost / totalPeople;
}

function formatPrice(p) {
  return '$' + p.toFixed(0);
}

// ── Filter logic ──────────────────────────────────────────────────────────────

function getVisible() {
  return RESTAURANTS.filter(r => {
    if (r.lat == null || r.lng == null) return false;
    const price = avgCost(r);
    return price >= priceMin
        && price <= priceMax
        && activeCuisines.has(r.cuisine);
  });
}

// ── Map ───────────────────────────────────────────────────────────────────────

function initMap() {
  const centerLat = RESTAURANTS.reduce((s, r) => s + r.lat, 0) / RESTAURANTS.length;
  const centerLng = RESTAURANTS.reduce((s, r) => s + r.lng, 0) / RESTAURANTS.length;

  map = L.map('map').setView([centerLat, centerLng], 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
  }).addTo(map);
}

function makeIcon() {
  return L.divIcon({
    className: 'map-marker',
    html: '<div class="marker-dot"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10]
  });
}

function popupHTML(r) {
  const price = avgCost(r);
  return `<div class="popup-name">${r.name}</div>
          <div class="popup-meta">${r.cuisine} &middot; ${formatPrice(price)}/person</div>
          <div class="popup-desc">${r.description}</div>`;
}

function renderMarkers() {
  // Remove old markers
  Object.values(markers).forEach(m => m.remove());
  Object.keys(markers).forEach(k => delete markers[k]);

  getVisible().forEach(r => {
    const marker = L.marker([r.lat, r.lng], { icon: makeIcon() });
    marker.bindPopup(popupHTML(r), { minWidth: 200, maxWidth: 260 });

    marker.on('click', () => {
      selectRestaurant(r._id, /* fromMap */ true);
    });

    marker.addTo(map);
    markers[r._id] = marker;
  });
}

function setMarkerActive(id, active) {
  const marker = markers[id];
  if (!marker) return;
  const el = marker.getElement();
  if (el) el.querySelector('.marker-dot')?.classList.toggle('active', active);
}

// ── Restaurant list ───────────────────────────────────────────────────────────

function renderList() {
  const list    = document.getElementById('restaurant-list');
  const count   = document.getElementById('list-count');
  const visible = getVisible();

  count.textContent = `Showing ${visible.length} of ${RESTAURANTS.length} places`;

  list.innerHTML = '';
  visible.forEach(r => {
    const card = document.createElement('div');
    card.className = 'restaurant-card' + (r._id === selectedId ? ' selected' : '');
    card.dataset.id = r._id;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}`;
    card.innerHTML = `
      <div class="card-header">
        <span class="card-name">${r.name}</span>
        <span class="card-price">${formatPrice(avgCost(r))}/person</span>
      </div>
      <div class="card-cuisine">${r.cuisine}</div>
      <div class="card-desc">${r.description}</div>
      <a class="card-maps-btn" href="${mapsUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
        Directions
      </a>
    `;
    card.addEventListener('click', () => selectRestaurant(r._id, /* fromMap */ false));
    list.appendChild(card);
  });
}

// ── Selection ─────────────────────────────────────────────────────────────────

function selectRestaurant(id, fromMap) {
  // Deactivate previous marker
  if (selectedId !== null) setMarkerActive(selectedId, false);

  selectedId = id;

  // Highlight list card
  document.querySelectorAll('.restaurant-card').forEach(card => {
    card.classList.toggle('selected', parseInt(card.dataset.id) === id);
  });

  // Scroll card into view
  const card = document.querySelector(`.restaurant-card[data-id="${id}"]`);
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Activate marker
  setMarkerActive(id, true);

  // Open popup and pan (always, whether click came from map or list)
  if (markers[id]) {
    map.panTo(markers[id].getLatLng(), { animate: true });
    if (!fromMap) markers[id].openPopup();
  }
}

// ── Price slider ─────────────────────────────────────────────────────────────

function initPriceSlider() {
  const minInput  = document.getElementById('price-min');
  const maxInput  = document.getElementById('price-max');
  const minLabel  = document.getElementById('price-min-label');
  const maxLabel  = document.getElementById('price-max-label');
  const fill      = document.getElementById('range-fill');

  minInput.max = maxPrice;
  maxInput.max = maxPrice;
  minInput.value = 0;
  maxInput.value = maxPrice;
  priceMin = 0;
  priceMax = Infinity;

  function updateSlider() {
    let minVal = parseInt(minInput.value);
    let maxVal = parseInt(maxInput.value);

    if (minVal >= maxVal) {
      minVal = maxVal - 1;
      minInput.value = minVal;
    }

    const minPct = (minVal / maxPrice) * 100;
    const maxPct = (maxVal / maxPrice) * 100;

    fill.style.left  = minPct + '%';
    fill.style.width = (maxPct - minPct) + '%';

    // Raise min thumb z-index when pushed to the right to keep it reachable
    minInput.style.zIndex = minVal > maxPrice * 0.9 ? 5 : 3;

    minLabel.textContent = formatPrice(minVal);
    maxLabel.textContent = maxVal >= maxPrice
      ? formatPrice(maxPrice) + '+'
      : formatPrice(maxVal);

    priceMin = minVal;
    priceMax = maxVal >= maxPrice ? Infinity : maxVal;

    applyFilters();
  }

  minInput.addEventListener('input', updateSlider);
  maxInput.addEventListener('input', updateSlider);

  updateSlider();
}

// ── Cuisine filters ───────────────────────────────────────────────────────────

function buildCuisineFilters() {
  const cuisines  = [...new Set(RESTAURANTS.map(r => r.cuisine))].sort();
  activeCuisines  = new Set(cuisines);

  const container = document.getElementById('cuisine-filters');
  cuisines.forEach(cuisine => {
    const label = document.createElement('label');
    label.className = 'cuisine-checkbox active';

    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.checked = true;
    cb.value   = cuisine;

    cb.addEventListener('change', () => {
      if (cb.checked) {
        activeCuisines.add(cuisine);
        label.classList.add('active');
      } else {
        activeCuisines.delete(cuisine);
        label.classList.remove('active');
      }
      applyFilters();
    });

    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + cuisine));
    container.appendChild(label);
  });
}

// ── Apply filters ─────────────────────────────────────────────────────────────

function applyFilters() {
  renderList();
  renderMarkers();

  // Re-select if still visible, otherwise clear selection
  if (selectedId !== null && markers[selectedId]) {
    setMarkerActive(selectedId, true);
  } else {
    selectedId = null;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Assign stable numeric IDs
  RESTAURANTS.forEach((r, i) => r._id = i);

  // Compute max price from data, rounded up to nearest $5
  const computedMax = Math.max(...RESTAURANTS.map(avgCost));
  maxPrice = Math.ceil(computedMax / 5) * 5 + 5;

  initMap();
  buildCuisineFilters();
  initPriceSlider();   // calls applyFilters → renderList + renderMarkers

  // Fit map to all markers after tiles load
  const bounds = L.latLngBounds(RESTAURANTS.map(r => [r.lat, r.lng]));
  map.fitBounds(bounds, { padding: [30, 30] });
});
