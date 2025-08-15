import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { toast } from "react-toastify";
import { getSocket } from "../../services/api";
// Map imports for route preview
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

export default function BookingRequests() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [editingFareId, setEditingFareId] = useState(null);
  const [fareInput, setFareInput] = useState("");
  // Modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [fareInModal, setFareInModal] = useState("");
  const [pickupCoord, setPickupCoord] = useState(null);
  const [dropCoord, setDropCoord] = useState(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/drivers/bookings?status=pending");
      setBookings(res.data || []);
    } catch (err) {
      setError("Failed to load booking requests");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    // Fetch driver userId and join room
    api.get("/drivers/me").then((res) => {
      const userId = res.data?.driver?.userId?._id;
      if (userId) {
        socket.emit("join", { driverUserId: userId });
      }
    });

    const onCreated = () => {
      fetchData();
      toast.info("New booking request");
    };
    const onStatus = ({ bookingId, status }) => {
      fetchData();
      if (status === "accepted") toast.info("You accepted a booking");
      if (status === "confirmed") toast.success("User confirmed the booking");
      if (status === "rejected") toast.error("You rejected a booking");
    };
    socket.on("booking:created", onCreated);
    socket.on("booking:status", onStatus);
    return () => {
      socket.off("booking:created", onCreated);
      socket.off("booking:status", onStatus);
    };
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/drivers/bookings/${id}/status`, { status });
      toast.success(`Request ${status}`);
      fetchData();
    } catch (err) {
      setError("Failed to update booking");
    }
  };

  const handleSetFare = async (id) => {
    if (!fareInput || isNaN(Number(fareInput)) || Number(fareInput) <= 0) {
      toast.error("Please enter a valid fare");
      return;
    }
    try {
      await api.patch(`/drivers/bookings/${id}/fare`, {
        fare: Number(fareInput),
      });
      toast.success("Fare saved");
      setEditingFareId(null);
      setFareInput("");
      fetchData();
    } catch (err) {
      setError("Failed to set fare");
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.put(`/drivers/bookings/${id}/status`, { status: "accepted" });
      toast.success("Trip confirmed");
      fetchData();
    } catch (err) {
      setError("Failed to confirm booking");
    }
  };

  // Open modal with map preview and fare input
  const openMapModal = (b) => {
    setSelectedBooking(b);
    setFareInModal(b.fare && Number(b.fare) > 0 ? String(b.fare) : "");
  };
  const closeMapModal = () => {
    setSelectedBooking(null);
    setFareInModal("");
    setPickupCoord(null);
    setDropCoord(null);
    setGeocodeError("");
    setGeocodeLoading(false);
  };

  // Geocode when modal opens based on booking text fields
  useEffect(() => {
    if (!selectedBooking) return;
    const { pickupLocation, dropLocation } = selectedBooking;
    if (!pickupLocation || !dropLocation) return;
    let cancelled = false;
    const run = async () => {
      setGeocodeLoading(true);
      setGeocodeError("");
      try {
        const enc = encodeURIComponent;
        const headers = { Accept: "application/json" };
        const [pRes, dRes] = await Promise.all([
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${enc(pickupLocation)}`, { headers }),
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${enc(dropLocation)}`, { headers }),
        ]);
        const [pJson, dJson] = await Promise.all([pRes.json(), dRes.json()]);
        const p = Array.isArray(pJson) && pJson[0]
          ? { lat: parseFloat(pJson[0].lat), lon: parseFloat(pJson[0].lon) }
          : null;
        const d = Array.isArray(dJson) && dJson[0]
          ? { lat: parseFloat(dJson[0].lat), lon: parseFloat(dJson[0].lon) }
          : null;
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
  }, [selectedBooking]);

  // Routing helper
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

  // Save fare then confirm in a single action
  const handleSaveFareAndConfirm = async (b) => {
    if (!fareInModal || isNaN(Number(fareInModal)) || Number(fareInModal) <= 0) {
      toast.error("Please enter a valid fare");
      return;
    }
    try {
      await api.patch(`/drivers/bookings/${b._id}/fare`, { fare: Number(fareInModal) });
      await api.put(`/drivers/bookings/${b._id}/status`, { status: "accepted" });
      toast.success("Fare saved and booking accepted");
      closeMapModal();
      fetchData();
    } catch (e) {
      toast.error("Failed to save fare or accept booking");
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl w-full bg-white rounded-xl shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">
          Booking Requests
        </h2>
        {error && (
          <div className="bg-red-50 text-red-700 rounded px-3 py-2 mb-4">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-indigo-400">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="text-gray-500">No pending requests.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <li
                key={b._id}
                className="py-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-indigo-700">
                    {b.pickupLocation} → {b.dropLocation}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(b.bookingTime || b.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-indigo-500 font-semibold">
                    Trip Type: {b.tripType || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">Fare: ₹{b.fare}</div>
                  {b.userId && (
                    <div className="text-xs text-gray-500 mt-1">
                      Requester:{" "}
                      <span className="font-medium">{b.userId.name}</span> •{" "}
                      <a className="underline" href={`tel:${b.userId.phone}`}>
                        {b.userId.phone}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 items-center justify-end">
                  <button
                    onClick={() => openMapModal(b)}
                    className="inline-flex items-center justify-center min-w-[140px] px-4 py-2.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm shadow-sm"
                  >
                    View Route
                  </button>
                  {editingFareId === b._id ? (
                    <>
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter fare"
                        value={fareInput}
                        onChange={(e) => setFareInput(e.target.value)}
                        className="px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-28 text-base"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSetFare(b._id)}
                        className="inline-flex items-center justify-center min-w-[120px] px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm shadow-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingFareId(null);
                          setFareInput("");
                        }}
                        className="inline-flex items-center justify-center min-w-[120px] px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm shadow-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {!b.fare || b.fare <= 0 ? (
                        <button
                          onClick={() => {
                            setEditingFareId(b._id);
                            setFareInput("");
                          }}
                          className="inline-flex items-center justify-center min-w-[120px] px-4 py-2.5 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold text-sm shadow-sm"
                        >
                          Set Fare
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConfirm(b._id)}
                          className="inline-flex items-center justify-center min-w-[120px] px-4 py-2.5 rounded-xl bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-sm shadow-sm"
                        >
                          Confirm
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(b._id, "rejected")}
                        className="inline-flex items-center justify-center min-w-[120px] px-4 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-sm shadow-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map + Fare Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={closeMapModal}
            >
              &times;
            </button>
            <h4 className="text-2xl font-bold mb-3 text-indigo-700">Route & Fare</h4>

            <div className="text-sm text-gray-600 mb-2">
              <div className="font-medium text-indigo-700">
                {selectedBooking.pickupLocation} → {selectedBooking.dropLocation}
              </div>
              <div>
                {new Date(selectedBooking.bookingTime || selectedBooking.createdAt).toLocaleString()} • {selectedBooking.tripType || "N/A"}
              </div>
            </div>

            <div className="w-full mb-4">
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

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                placeholder="Enter fare"
                value={fareInModal}
                onChange={(e) => setFareInModal(e.target.value)}
                className="px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36 text-base"
              />
              <button
                onClick={() => handleSaveFareAndConfirm(selectedBooking)}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm shadow-sm"
              >
                Save Fare & Confirm
              </button>
              <button
                onClick={closeMapModal}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
