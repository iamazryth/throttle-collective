let rides = JSON.parse(localStorage.getItem('throttleRides')) || [
  {
    id: 1,
    title: "Tamborine Mountain Twisties",
    date: "2026-05-25",
    time: "07:30",
    location: "Shell Station, Pacific Motorway Exit 57",
    mapsLink: "https://maps.google.com/?q=Shell+Station+Tamborine",
    description: "80km of perfect sweeping corners through the Scenic Rim.\nCoffee stop at the top.\nIntermediate pace."
  }
];

let scriptFileHandle = null;

// Connect script.js for auto updates
async function connectScriptFile() {
  try {
    scriptFileHandle = await window.showOpenFilePicker({
      types: [{ description: 'JavaScript File', accept: { 'text/javascript': ['.js'] }}]
    }).then(h => h[0]);

    await scriptFileHandle.requestPermission({ mode: 'readwrite' });
    alert("✅ script.js connected! Future changes will update automatically.");
    document.getElementById('connect-btn').textContent = "✅ Connected";
  } catch (err) {
    alert("File connection cancelled or not supported.");
  }
}

async function updateScriptFile() {
  if (!scriptFileHandle) return;
  try {
    const content = `let rides = ${JSON.stringify(rides, null, 2)};\n\n` +
                    `let scriptFileHandle = null;\n\n` +
                    `// === Copy the rest of the code from below this line ===`;

    const writable = await scriptFileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (e) {}
}

function saveRides() {
  localStorage.setItem('throttleRides', JSON.stringify(rides));
  updateScriptFile();
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });
}

function renderRides() {
  const container = document.getElementById('rides-list');
  if (!container) return;
  container.innerHTML = '';

  if (rides.length === 0) {
    container.innerHTML = `<p class="col-span-3 text-center py-20 text-zinc-500">No rides scheduled yet.</p>`;
    return;
  }

  rides.sort((a, b) => new Date(a.date) - new Date(b.date));

  rides.forEach(ride => {
    const card = document.createElement('div');
    card.className = `ride-card bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden cursor-pointer`;
    card.innerHTML = `
      <div class="h-2 bg-gradient-to-r from-orange-500 to-amber-500"></div>
      <div class="p-8">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-orange-500 text-sm font-medium">${formatDate(ride.date)}</div>
            <div class="text-2xl font-semibold mt-1">${ride.title}</div>
          </div>
          <div class="text-right">
            <div class="text-3xl font-mono font-bold text-orange-400">${ride.time}</div>
          </div>
        </div>
        <div class="mt-6 flex items-center gap-3 text-sm text-zinc-400">
          <i class="fa-solid fa-location-dot"></i>
          <span>${ride.location}</span>
        </div>
        <div onclick="viewRide(${ride.id}); event.stopImmediatePropagation()" 
             class="mt-8 bg-zinc-800 hover:bg-orange-600 transition-colors text-center py-4 rounded-2xl font-medium">
          VIEW RIDE DETAILS →
        </div>
      </div>
    `;
    card.onclick = () => viewRide(ride.id);
    container.appendChild(card);
  });

  const countEl = document.getElementById('ride-count');
  if (countEl) countEl.textContent = `${rides.length} ride${rides.length !== 1 ? 's' : ''} scheduled`;
}

function viewRide(id) {
  const ride = rides.find(r => r.id === id);
  if (!ride) return;

  const detailHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${ride.title} • Throttle</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
    </head>
    <body class="bg-zinc-950 text-zinc-200 p-6 min-h-screen">
      <div class="max-w-2xl mx-auto">
        <button onclick="history.back()" class="mb-6 text-orange-500 flex items-center gap-2"><i class="fa-solid fa-arrow-left"></i> Back</button>
        <h1 class="text-4xl font-bold">${ride.title}</h1>
        <div class="flex gap-4 mt-6">
          <div class="bg-zinc-900 px-6 py-3 rounded-2xl">${formatDate('${ride.date}')}</div>
          <div class="bg-zinc-900 px-6 py-3 rounded-2xl">${ride.time}</div>
        </div>
        <div class="mt-8 bg-zinc-900 p-8 rounded-3xl text-lg">${ride.location}</div>
        <div class="mt-10 whitespace-pre-line leading-relaxed">${ride.description}</div>
        <div class="mt-12 grid grid-cols-2 gap-6">
          ${ride.mapsLink ? `<a href="${ride.mapsLink}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 py-6 rounded-3xl text-center font-semibold">Open in Maps</a>` : ''}
          <button onclick="alert('Calendar added! (Demo)')" class="bg-blue-600 hover:bg-blue-700 py-6 rounded-3xl text-center font-semibold">Add to Calendar</button>
        </div>
      </div>
    </body>
    </html>`;

  const win = window.open();
  win.document.write(detailHTML);
  win.document.close();
}

function addRide(e) {
  e.preventDefault();
  const newRide = {
    id: Date.now(),
    title: document.getElementById('title').value,
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    location: document.getElementById('location').value,
    mapsLink: document.getElementById('maps-link').value,
    description: document.getElementById('description').value
  };

  rides.push(newRide);
  saveRides();
  renderRides();
  renderAdminRides();
  alert("✅ Ride added successfully!");
  e.target.reset();
}

function deleteRide(id) {
  if (confirm("Delete this ride permanently?")) {
    rides = rides.filter(r => r.id !== id);
    saveRides();
    renderRides();
    renderAdminRides();
    alert("✅ Ride deleted!");
  }
}

function renderAdminRides() {
  const container = document.getElementById('admin-rides-list');
  if (!container) return;
  container.innerHTML = '';

  if (rides.length === 0) {
    container.innerHTML = `<p class="text-center py-8 text-zinc-500">No rides yet.</p>`;
    return;
  }

  rides.forEach(ride => {
    const div = document.createElement('div');
    div.className = "flex justify-between items-center bg-zinc-800 p-5 rounded-2xl";
    div.innerHTML = `
      <div>
        <div class="font-medium">${ride.title}</div>
        <div class="text-sm text-zinc-400">${formatDate(ride.date)} • ${ride.time}</div>
      </div>
      <button onclick="deleteRide(${ride.id}); event.stopImmediatePropagation()" 
              class="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl text-white">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    container.appendChild(div);
  });
}

function goToAdmin() {
  const pass = prompt("Enter admin password:");
  if (pass === "throttle2026" || pass === "admin") {
    window.location.href = "admin.html";
  } else {
    alert("Incorrect password");
  }
}

function showAbout() {
  alert("Throttle Collective - Private Motorbike Group");
}

// Initialize
window.onload = () => {
  if (document.getElementById('rides-list')) renderRides();
  if (document.getElementById('admin-rides-list')) renderAdminRides();
};
