document.addEventListener('DOMContentLoaded', () => {
  try {
    // Check for Leaflet only if the map element is present on the page
    if (document.getElementById('map') && typeof L === 'undefined') {
      alert("Error: Leaflet Map Library not loaded. Please check your internet connection.");
      return;
    }
    initializeApp();
  } catch (e) {
    console.error("An unexpected error occurred:", e);
    alert("App Error: " + e.message + ". Please try reloading the page.");
  }
});

function initializeApp() {
  /* ================= GREETINGS SLIDER ================= */
  const greetings = [
    { text: "Merry Christmas From Santa!", img: "assets/greeting1.jpg" },
    { text: "Joy to the World!", img: "assets/greeting2.jpg" },
    { text: "Peace on Earth & Goodwill to All", img: "assets/greeting3.jpg" }
  ];

  const sliderTrack = document.getElementById("slider-track");
  let currentSlide = 0;

  // Initialize Slides
  if (sliderTrack) {
    greetings.forEach(g => {
      const slide = document.createElement("div");
      slide.className = "slide";
      // Fallback gradient if image fails or for styling
      slide.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${g.img})`;

      slide.innerHTML = `
        <div class="slide-content">
          <h3>${g.text}</h3>
        </div>
      `;
      sliderTrack.appendChild(slide);
    });
  }


  function updateSlider() {
    if (!sliderTrack) return; // Ensure sliderTrack exists
    sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
  }

  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentSlide = (currentSlide + 1) % greetings.length;
      updateSlider();
    });
  }


  const prevBtn = document.getElementById("prevBtn");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentSlide = (currentSlide - 1 + greetings.length) % greetings.length;
      updateSlider();
    });
  }


  // Auto-slide every 5 seconds
  setInterval(() => {
    currentSlide = (currentSlide + 1) % greetings.length;
    updateSlider();
  }, 5000);


  /* ================= SPINNING WHEEL ================= */
  const prizes = [
    "Cake 🍰",
    "Wine 🍷",
    "Clock ⏰",
    "Robot 🤖",
    "Perfume 🧴",
    "Choc 🍫"
  ];

  // Generate Wheel Labels
  const wheel = document.getElementById("wheel");
  if (wheel) { // Check if wheel element exists
    wheel.innerHTML = ""; // Clear existing
    const segmentAngle = 360 / prizes.length;

    prizes.forEach((prize, index) => {
      const label = document.createElement("div");
      label.className = "wheel-label";
      label.innerText = prize;

      // Position text in the middle of the segment
      // rotate(angle) -> points to segment
      // translateY(-X) -> moves out from center
      // rotate(90deg) -> makes text radial (spoke-like)
      const angle = (index * segmentAngle) + (segmentAngle / 2);

      label.style.transform = `
        rotate(${angle}deg) 
        translateY(-75px)
        rotate(90deg)
      `;

      wheel.appendChild(label);
    });
  }


  // Expose spin globally for html button
  window.spin = function () {
    const spinBtn = document.getElementById("spinBtn");
    if (spinBtn) {
      spinBtn.disabled = true;
      spinBtn.innerText = "Spinning...";
    }


    if (!wheel) {
      console.error("Wheel element not found for spinning.");
      if (spinBtn) {
        spinBtn.disabled = false;
        spinBtn.innerText = "SPIN AGAIN 🎁";
      }
      return;
    }

    // Random rotation between 3 to 6 full spins + random offset
    const deg = Math.floor(1000 + Math.random() * 3000);

    wheel.style.transition = 'transform 4s cubic-bezier(0.25, 1, 0.5, 1)';
    wheel.style.transform = `rotate(${deg}deg)`;

    setTimeout(() => {
      if (spinBtn) {
        spinBtn.disabled = false;
        spinBtn.innerText = "SPIN AGAIN 🎁";
      }
      // Pick a random prize
      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      alert(`🎉 You won a ${prize}! Merry Christmas! 🎅`);
    }, 4000);
  }


  /* ================= BIBLE QUOTES ================= */
  const quotes = [
    "For unto us a child is born, unto us a son is given... - Isaiah 9:6",
    "She will give birth to a son, and you are to give him the name Jesus... - Matthew 1:21",
    "Glory to God in the highest heaven, and on earth peace to those on whom his favor rests. - Luke 2:14"
  ];

  const quoteList = document.getElementById("quotes");
  if (quoteList) {
    quotes.forEach(q => {
      const li = document.createElement("li");
      li.textContent = `“${q}”`;
      quoteList.appendChild(li);
    });
  }


  /* ================= MAP + SANTA TRACKER logic ================= */
  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.warn("Map element not found. Skipping map initialization.");
    return; // Exit if no map element
  }

  const map = L.map('map').setView([20, 0], 2);

  // Cool dark map tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Custom Santa Icon
  // Custom Santa Icon (Sleigh)
  const santaIcon = L.icon({
    // iconUrl: 'https://cdn-icons-png.flaticon.com/512/4084/4084534.png', // Reindeer Sleigh Icon
    iconUrl: 'assets/santa.png',


    iconSize: [80, 80],
    iconAnchor: [40, 40],
    popupAnchor: [0, -40]
  });

  const cityIcon = L.divIcon({
    className: 'city-marker',
    html: '<div style="width:14px;height:14px;background:#06d6a0;border-radius:50%;border:2px solid white;box-shadow:0 0 10px #06d6a0;"></div>',
    iconSize: [14, 14]
  });

  // GLOBAL LOOP STATE
  window.santaState = {
    locations: [],
    currentSegment: 0,
    startTime: null,
    marker: null,
    looping: true
  };

  fetch("data/locations.json")
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(locations => {
      window.santaState.locations = locations;
      initMap(locations, map, santaIcon, cityIcon);
    })
    .catch(err => {
      console.error("Error loading locations:", err);
      const progressText = document.getElementById("progress-text");
      if (progressText) {
        progressText.innerText = "Error loading delivery data. Please check console for details.";
      }
    });
}

function initMap(locations, map, santaIcon, cityIcon) {
  // 1. Add markers AND Text Labels
  locations.forEach(loc => {
    // Dot marker
    L.marker([loc.lat, loc.lng], { icon: cityIcon }).addTo(map);

    // Explicit Label (DivIcon)
    const labelIcon = L.divIcon({
      className: 'map-text-label',
      html: `<div style="text-align:center; width:150px; transform:translate(-50%, -100%);">
               <div style="font-weight:900; font-size:14px; color:white; text-shadow:0 0 4px black; margin-bottom:2px;">${loc.city}</div>
               <div style="font-size:11px; color:#ffd166; text-shadow:0 0 4px black;">Host: ${loc.recipient}</div>
             </div>`,
      iconSize: [0, 0], // Size of the icon container itself (can be 0,0 if content defines size)
      iconAnchor: [0, 15] // Offset above the dot marker
    });
    // Add a marker for the label, with a higher zIndexOffset to ensure it's above other elements
    L.marker([loc.lat, loc.lng], { icon: labelIcon, zIndexOffset: 900 }).addTo(map);
  });

  // 2. Draw Path
  const latlngs = locations.map(l => [l.lat, l.lng]);
  L.polyline(latlngs, {
    color: '#e63946',
    weight: 3,
    opacity: 0.8,
    dashArray: '10, 10'
  }).addTo(map);

  map.fitBounds(L.latLngBounds(latlngs).pad(0.2));

  // 3. Initialize Santa
  window.santaState.marker = L.marker(latlngs[0], { icon: santaIcon, zIndexOffset: 1000 }).addTo(map);

  // Start Global Loop
  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (!window.santaState.looping) return;

  const state = window.santaState;
  const route = state.locations;
  const duration = 5000;

  if (!state.startTime) state.startTime = timestamp;
  const progress = timestamp - state.startTime;
  const percentage = Math.min(progress / duration, 1);

  const start = route[state.currentSegment];
  const end = route[state.currentSegment + 1];

  if (!end) {
    state.currentSegment = 0;
    state.startTime = null;
    requestAnimationFrame(gameLoop);
    return;
  }

  const currentLat = start.lat + (end.lat - start.lat) * percentage;
  const currentLng = start.lng + (end.lng - start.lng) * percentage;
  state.marker.setLatLng([currentLat, currentLng]);

  updateProgressUI(start, end, percentage, state.currentSegment, route.length);

  if (progress < duration) {
    requestAnimationFrame(gameLoop);
  } else {
    state.currentSegment++;
    state.startTime = null;
    requestAnimationFrame(gameLoop);
  }
}

function updateProgressUI(start, end, percentage, segmentIndex, totalStops) {
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  if (!progressBar || !progressText) return; // Ensure elements exist

  const totalLegs = totalStops - 1;
  const totalProgress = ((segmentIndex + percentage) / totalLegs) * 100;

  progressBar.style.width = `${totalProgress}%`;

  let msg = "";
  if (start.city === "North Pole") {
    msg = `🚀 DEPARTING Santa's Workshop ➔ Delivering to ${end.recipient} in ${end.city}`;
  } else {
    msg = `🎁 Flying from ${start.city} ➔ ${end.recipient} in ${end.city}`;
  }
  progressText.innerHTML = `<b>${msg}</b> <br> <span style="font-size:16px">Route Completion: ${Math.round(totalProgress)}%</span>`;
}


// Nav Highlighting
// This part remains outside initializeApp but inside DOMContentLoaded
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll(".floating-nav a").forEach(link => link.classList.remove("active"));
      const activeLink = document.querySelector(`.floating-nav a[href="#${entry.target.id}"]`);
      if (activeLink) activeLink.classList.add("active");
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll("section").forEach(s => observer.observe(s));
