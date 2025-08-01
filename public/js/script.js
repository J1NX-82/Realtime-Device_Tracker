const socket = io();

const map = L.map("map").setView([0, 0], 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data © OpenStreetMap contributors",
}).addTo(map);

const markers = {}; // Stores all user markers, including "self"

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      // Emit location to server
      socket.emit("send-location", { latitude, longitude });

      // Add or update self marker
      if (!markers["self"]) {
        markers["self"] = L.marker([latitude, longitude]).addTo(map);
      }
      markers["self"].setLatLng([latitude, longitude]);
      map.setView([latitude, longitude], 15);
    },
    (error) => {
      console.log("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}

// Handle receiving other users' locations
socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;

  // Ignore self if received back from server
  if (id === socket.id) return;

  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }
});

// Remove marker when a user disconnects
socket.on("user-disconnect", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
