const express = require("express");
const axios = require("axios");
const router = express.Router();

// Haversine distance in kilometers
function haversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lon - coords1.lon);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/location/geocode?location=Hyderabad,India
router.get("/geocode", async (req, res) => {
  try {
    const { location } = req.query;
    if (!location) return res.status(400).json({ error: "location is required" });
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: location, format: "json", limit: 1 },
      headers: { "User-Agent": "bookingdriving-app" },
    });
    if (!response.data?.length) return res.status(404).json({ error: "Location not found" });
    const { lat, lon, display_name } = response.data[0];
    res.json({ lat: parseFloat(lat), lon: parseFloat(lon), display_name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/location/distance?from=A&to=B
router.get("/distance", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from and to are required" });
    const [fromRes, toRes] = await Promise.all([
      axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: from, format: "json", limit: 1 },
        headers: { "User-Agent": "bookingdriving-app" },
      }),
      axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: to, format: "json", limit: 1 },
        headers: { "User-Agent": "bookingdriving-app" },
      }),
    ]);
    if (!fromRes.data?.length || !toRes.data?.length) {
      return res.status(404).json({ error: "One or both locations not found" });
    }
    const coords1 = {
      lat: parseFloat(fromRes.data[0].lat),
      lon: parseFloat(fromRes.data[0].lon),
    };
    const coords2 = {
      lat: parseFloat(toRes.data[0].lat),
      lon: parseFloat(toRes.data[0].lon),
    };
    const distance_km = parseFloat(haversineDistance(coords1, coords2).toFixed(3));
    res.json({ from: coords1, to: coords2, distance_km });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/location/suggest?q=hyd&limit=5
router.get("/suggest", async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q || String(q).trim().length < 2) {
      return res.status(400).json({ error: "q must be at least 2 characters" });
    }
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q, format: "json", addressdetails: 1, limit: Math.min(Number(limit) || 5, 10) },
      headers: { "User-Agent": "bookingdriving-app" },
    });
    const items = (response.data || []).map((it) => ({
      place_id: it.place_id,
      display_name: it.display_name,
      lat: parseFloat(it.lat),
      lon: parseFloat(it.lon),
    }));
    res.json({ suggestions: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
