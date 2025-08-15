import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import api, { getSocket } from "../../services/api";
import { toast } from "react-toastify";
// Map & routing imports for showing route between pickup and destination
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

export default function BookDriver() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  // Suggestions state
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  // Distance preview
  const [distancePreview, setDistancePreview] = useState(null);
  const suggestAbortRef = useRef({ pickup: null, drop: null });
  const debounceRef = useRef({ pickup: null, drop: null, distance: null });
  // Lightweight caches to avoid repeated network calls
  const suggestCacheRef = useRef({ pickup: new Map(), drop: new Map() });
  const distanceCacheRef = useRef(new Map());
  const [pickupSuggestLoading, setPickupSuggestLoading] = useState(false);
  const [dropSuggestLoading, setDropSuggestLoading] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tripType, setTripType] = useState("one-way");
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStatusByDriver, setBookingStatusByDriver] = useState({});
  // Coordinates for map routing (resolved when modal opens)
  const [pickupCoord, setPickupCoord] = useState(null); // { lat, lon }
  const [dropCoord, setDropCoord] = useState(null); // { lat, lon }
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");

  // Listen for realtime updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    const onDriverStatus = () => {};
    const onBookingStatus = async () => {
      try {
        await refreshBookingMap();
      } catch {}
    };
    socket.on("driver:status", onDriverStatus);
    socket.on("booking:status", onBookingStatus);
    return () => {
      socket.off("driver:status", onDriverStatus);
      socket.off("booking:status", onBookingStatus);
    };
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    setError("");
    setDrivers([]);
    try {
      // Example: send search params to backend
      const res = await api.get("/drivers", {
        params: {
          available: true,
          pickup: pickup,
          drop: drop,
          date: date,
          time: time,
          tripType: tripType,
        },
      });
      const list = res.data.drivers || [];
      setDrivers(list);
      try {
        await refreshBookingMap(list);
      } catch {}
    } catch (err) {
      setError("Failed to fetch drivers");
    }
    setLoading(false);
  };

  // Fetch suggestions when user types 2+ characters (debounced + cached)
  useEffect(() => {
    const q = pickup.trim();
    if (debounceRef.current.pickup) clearTimeout(debounceRef.current.pickup);
    if (q.length < 2) {
      setPickupSuggestions([]);
      return;
    }
    // Cache hit
    const cached = suggestCacheRef.current.pickup.get(q);
    if (cached) {
      setPickupSuggestions(cached);
      return;
    }
    debounceRef.current.pickup = setTimeout(async () => {
      setPickupSuggestLoading(true);
      try {
        const res = await api.get("/location/suggest", { params: { q, limit: 6 } });
        const list = res.data?.suggestions || [];
        setPickupSuggestions(list);
        suggestCacheRef.current.pickup.set(q, list);
      } catch {
        setPickupSuggestions([]);
      } finally {
        setPickupSuggestLoading(false);
      }
    }, 180);
  }, [pickup]);

  useEffect(() => {
    const q = drop.trim();
    if (debounceRef.current.drop) clearTimeout(debounceRef.current.drop);
    if (q.length < 2) {
      setDropSuggestions([]);
      return;
    }
    const cached = suggestCacheRef.current.drop.get(q);
    if (cached) {
      setDropSuggestions(cached);
      return;
    }
    debounceRef.current.drop = setTimeout(async () => {
      setDropSuggestLoading(true);
      try {
        const res = await api.get("/location/suggest", { params: { q, limit: 6 } });
        const list = res.data?.suggestions || [];
        setDropSuggestions(list);
        suggestCacheRef.current.drop.set(q, list);
      } catch {
        setDropSuggestions([]);
      } finally {
        setDropSuggestLoading(false);
      }
    }, 180);
  }, [drop]);

  // Live distance preview when both fields look valid (debounced + cached)
  useEffect(() => {
    if (debounceRef.current.distance) clearTimeout(debounceRef.current.distance);
    const p = pickup.trim();
    const d = drop.trim();
    if (p.length < 2 || d.length < 2) {
      setDistancePreview(null);
      return;
    }
    const key = `${p}__${d}`;
    const cached = distanceCacheRef.current.get(key);
    if (cached != null) {
      setDistancePreview(cached);
      return;
    }
    debounceRef.current.distance = setTimeout(async () => {
      try {
        const res = await api.get("/location/distance", { params: { from: p, to: d } });
        const val = res.data?.distance_km ?? null;
        setDistancePreview(val);
        if (val != null) distanceCacheRef.current.set(key, val);
      } catch {
        setDistancePreview(null);
      }
    }, 260);
  }, [pickup, drop]);

  const refreshBookingMap = async (driverList = drivers) => {
    try {
      // Require search context to correlate bookings; otherwise show default actions
      if (!date || !time || !pickup || !drop) {
        setBookingStatusByDriver({});
        return;
      }
      // Normalize route for robust comparison
      const normalize = (s) =>
        (s || "").trim().toLowerCase().replace(/\s+/g, " ");
      const pickNorm = normalize(pickup);
      const dropNorm = normalize(drop);
      // Compare at minute precision in local time to avoid tz mismatches
      const toKey = (d) => {
        const x = new Date(d);
        const pad = (n) => String(n).padStart(2, "0");
        return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(
          x.getDate()
        )}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
      };
      const targetKey = `${date}T${time}`;
      const res = await api.get("/bookings/user");
      const bookings = res.data.bookings || [];
      const ids = new Set((driverList || []).map((d) => String(d._id)));
      const map = {};
      // take latest booking per driver for the exact time and same route
      for (const b of bookings) {
        const dId = String(b.driverId?._id || b.driverId);
        if (!ids.has(dId)) continue;
        if (toKey(b.bookingTime) !== targetKey) continue;
        if (normalize(b.pickupLocation) !== pickNorm) continue;
        if (normalize(b.dropLocation) !== dropNorm) continue;
        if (!map[dId]) {
          map[dId] = { status: b.status, bookingId: b._id };
        }
      }
      setBookingStatusByDriver(map);
    } catch {}
  };

  const handleBookClick = (driver) => {
    setSelectedDriver(driver);
    setShowBookingModal(true);
  };

  // Geocode pickup/drop text to coordinates when booking modal opens
  useEffect(() => {
    const active = showBookingModal;
    if (!active) return;
    // Require both text fields
    if (!pickup || !drop) return;
    let cancelled = false;
    const run = async () => {
      setGeocodeLoading(true);
      setGeocodeError("");
      try {
        const enc = encodeURIComponent;
        const headers = { "Accept": "application/json" };
        const [pRes, dRes] = await Promise.all([
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${enc(pickup)}`, { headers }),
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${enc(drop)}`, { headers }),
        ]);
        const [pJson, dJson] = await Promise.all([pRes.json(), dRes.json()]);
        const p = Array.isArray(pJson) && pJson[0] ? { lat: parseFloat(pJson[0].lat), lon: parseFloat(pJson[0].lon) } : null;
        const d = Array.isArray(dJson) && dJson[0] ? { lat: parseFloat(dJson[0].lat), lon: parseFloat(dJson[0].lon) } : null;
        if (!cancelled) {
          setPickupCoord(p);
          setDropCoord(d);
          if (!p || !d) setGeocodeError("Could not resolve map locations.");
        }
      } catch (e) {
        if (!cancelled) setGeocodeError("Failed to load map route.");
      } finally {
        if (!cancelled) setGeocodeLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [showBookingModal, pickup, drop]);

  // Small helper component to draw the black route
  const Routing = ({ from, to }) => {
    const map = useMap();
    useEffect(() => {
      if (!map || !from || !to) return;
      const control = L.Routing.control({
        waypoints: [L.latLng(from.lat, from.lon), L.latLng(to.lat, to.lon)],
        lineOptions: { styles: [{ color: "black", weight: 5 }] },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
      }).addTo(map);
      return () => {
        try { map.removeControl(control); } catch {}
      };
    }, [map, from, to]);
    return null;
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/bookings", {
        driverId: selectedDriver._id,
        pickupLocation: pickup,
        dropLocation: drop,
        bookingTime: date + "T" + time,
        fare: selectedDriver.estimatedFare || 0,
        tripType,
      });
      setShowBookingModal(false);
      // Keep form values per request
      setSelectedDriver(null);
      try {
        const created = res.data?.booking;
        if (created) {
          const dId = String(created.driverId);
          setBookingStatusByDriver((prev) => ({
            ...prev,
            [dId]: { status: created.status, bookingId: created._id },
          }));
        }
      } catch {}
      // Optionally show success toast
      try {
        const { toast } = await import("react-toastify");
        toast.success("Request sent to driver!");
      } catch {}
    } catch (err) {
      const msg = err.response?.data?.message || "Booking failed";
      setError(msg);
      try {
        const { toast } = await import("react-toastify");
        toast.error(msg);
      } catch {}
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-3xl w-full mx-auto bg-white rounded-3xl shadow-2xl p-0 mt-14 animate-fade-in flex flex-col gap-8 border border-indigo-100">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-t-3xl px-10 py-8 flex flex-col items-center justify-center text-white shadow-lg">
          <div className="text-5xl mb-2">🚗</div>
          <h2 className="text-3xl font-bold mb-1">Book a Driver</h2>
          <p className="text-lg opacity-90">
            Find a reliable driver for your next trip in seconds.
          </p>
        </div>
        {/* Filters */}
        <form
          className="flex flex-col sm:flex-row flex-wrap gap-6 px-10 py-6 mt-[-2rem] z-10 bg-white/90 backdrop-blur rounded-2xl border border-indigo-100 shadow-xl"
          style={{ position: "relative" }}
          onSubmit={(e) => {
            e.preventDefault();
            fetchDrivers();
          }}
        >
          {/* Pickup Field */}
          <div className="flex-1 min-w-[260px] relative">
            <div className="flex items-center bg-white rounded-2xl shadow-md px-4 py-3 border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-300 transition">
              <span className="mr-3 text-indigo-500 text-xl">📍</span>
              <input
                type="text"
                className="flex-1 bg-transparent outline-none placeholder-gray-400 text-gray-800"
                placeholder="Pickup location"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                required
              />
              {pickup && (
                <button
                  type="button"
                  onClick={() => {
                    setPickup("");
                    setPickupSuggestions([]);
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear pickup"
                >
                  ✖
                </button>
              )}
              {pickupSuggestLoading && (
                <span className="ml-3 animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></span>
              )}
            </div>
            {pickupSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 z-20 bg-white border border-indigo-100 rounded-xl shadow-xl max-h-60 overflow-auto">
                {pickupSuggestions.map((s) => (
                  <button
                    key={`p-${s.place_id}`}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50"
                    onClick={() => {
                      setPickup(s.display_name);
                      setPickupSuggestions([]);
                    }}
                  >
                    {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drop Field */}
          <div className="flex-1 min-w-[260px] relative">
            <div className="flex items-center bg-white rounded-2xl shadow-md px-4 py-3 border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-300 transition">
              <span className="mr-3 text-indigo-500 text-xl">🏁</span>
              <input
                type="text"
                className="flex-1 bg-transparent outline-none placeholder-gray-400 text-gray-800"
                placeholder="Destination"
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
                required
              />
              {drop && (
                <button
                  type="button"
                  onClick={() => {
                    setDrop("");
                    setDropSuggestions([]);
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear destination"
                >
                  ✖
                </button>
              )}
              {dropSuggestLoading && (
                <span className="ml-3 animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></span>
              )}
            </div>
            {dropSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 z-20 bg-white border border-indigo-100 rounded-xl shadow-xl max-h-60 overflow-auto">
                {dropSuggestions.map((s) => (
                  <button
                    key={`d-${s.place_id}`}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50"
                    onClick={() => {
                      setDrop(s.display_name);
                      setDropSuggestions([]);
                    }}
                  >
                    {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-[150px] flex items-center bg-white rounded-xl shadow-sm px-4 py-3 border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-200 transition">
            <input
              type="date"
              className="flex-1 bg-transparent outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 min-w-[120px] flex items-center bg-white rounded-xl shadow-sm px-4 py-3 border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-200 transition">
            <input
              type="time"
              className="flex-1 bg-transparent outline-none"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 min-w-[150px] flex items-center bg-white rounded-xl shadow-sm px-4 py-3 border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-200 transition">
            <select
              className="flex-1 bg-transparent outline-none"
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
            >
              <option value="one-way">One Way</option>
              <option value="round-trip">Round Trip</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <div className="flex items-center justify-center w-full mt-2">
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                !pickup || !drop || !date || !time || !tripType || loading
              }
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Searching...
                </span>
              ) : (
                "Search"
              )}
            </button>
          </div>
          {distancePreview != null && (
            <div className="w-full text-center text-sm text-gray-600 -mt-2">
              Approx. straight‑line distance: <span className="font-semibold text-indigo-700">{Number(distancePreview).toFixed(2)} km</span>
            </div>
          )}
        </form>
        {/* Driver List */}
        <div className="px-10 pb-10">
          <h3 className="text-xl font-semibold text-indigo-600 mb-4 mt-2">
            Available Drivers
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mr-2"></span>
              <span className="text-indigo-400">Loading drivers...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 rounded px-3 py-2 mb-4">
              {error}
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-indigo-400 text-center py-8">
              No drivers available for your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {drivers.map((driver) => (
                <div
                  key={driver._id}
                  className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-2 border border-indigo-50 hover:shadow-xl transition"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                      {driver.userId?.profileImage ? (
                        <img
                          src={driver.userId.profileImage}
                          alt="avatar"
                          className="w-14 h-14 object-cover"
                        />
                      ) : (
                        <span className="text-3xl">👨‍✈️</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-indigo-700 text-lg">
                        {driver.userId?.name || "Driver"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Phone:{" "}
                        <span className="font-medium">
                          {driver.userId?.phone || "N/A"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Rating:{" "}
                        <span className="font-semibold text-yellow-500">
                          {driver.rating != null ? Number(driver.rating).toFixed(1) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const info = bookingStatusByDriver[String(driver._id)];
                    if (info?.status === "pending") {
                      return (
                        <button
                          className="mt-2 px-6 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-semibold shadow cursor-not-allowed"
                          disabled
                        >
                          Request Sent
                        </button>
                      );
                    }
                    if (
                      info?.status === "accepted" ||
                      info?.status === "confirmed" ||
                      info?.status === "rejected"
                    ) {
                      // Allow user to request again after trip is confirmed or rejected
                      return (
                        <button
                          className="mt-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow transition"
                          onClick={() => handleBookClick(driver)}
                        >
                          Make Request
                        </button>
                      );
                    }
                    return (
                      <button
                        className="mt-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow transition"
                        onClick={() => handleBookClick(driver)}
                      >
                        Make Request
                      </button>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowBookingModal(false)}
              >
                &times;
              </button>
              <h4 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center gap-2">
                🚗 Confirm Booking
              </h4>
              <form
                onSubmit={handleBookingSubmit}
                className="flex flex-col gap-5 px-2 py-2"
              >
                <div className="flex flex-col gap-3 mb-2">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      className="flex-2 w-1/2 rounded-lg px-4 py-3 border border-indigo-200 focus:border-indigo-500 outline-none bg-gray-50 text-base"
                      placeholder="Pickup Location"
                      value={pickup}
                      readOnly
                    />
                    <input
                      type="text"
                      className="flex-1 w-1/2 rounded-lg px-4 py-3 border border-indigo-200 focus:border-indigo-500 outline-none bg-gray-50 text-base"
                      placeholder="Drop Location"
                      value={drop}
                      readOnly
                    />
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="date"
                      className="rounded-lg w-1/2 px-4 py-3 border border-indigo-200 focus:border-indigo-500 outline-none bg-gray-50 text-base"
                      value={date}
                      readOnly
                    />
                    <input
                      type="time"
                      className="rounded-lg w-1/2 px-4 py-3 border border-indigo-200 focus:border-indigo-500 outline-none bg-gray-50 text-base"
                      value={time}
                      readOnly
                    />
                  </div>
                </div>
                <div className="text-base text-gray-600 mb-2 text-center">
                  Trip Type:{" "}
                  <span className="font-semibold text-indigo-700">
                    {tripType}
                  </span>
                </div>

                {/* Map preview with route */}
                <div className="w-full">
                  {geocodeLoading ? (
                    <div className="text-center text-indigo-400 py-6">Loading map...</div>
                  ) : geocodeError ? (
                    <div className="text-center text-red-500 py-4">{geocodeError}</div>
                  ) : pickupCoord && dropCoord ? (
                    <div className="w-full h-56 rounded-xl overflow-hidden border border-indigo-100">
                      <MapContainer
                        center={[pickupCoord.lat, pickupCoord.lon]}
                        zoom={12}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution="&copy; OpenStreetMap contributors"
                        />
                        <Routing from={pickupCoord} to={dropCoord} />
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-6">Map not available.</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="mt-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow transition text-lg w-full"
                >
                  Confirm Booking
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
