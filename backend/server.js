const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { initSocket } = require("./src/utils/socket");
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Import routes
const adminRoutes = require("./src/routes/admin");
const authRoutes = require("./src/routes/auth");
const bookingRoutes = require("./src/routes/booking");
const driverRoutes = require("./src/routes/driver");
const locationRoutes = require("./src/routes/location");

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/location", locationRoutes);
// app.use('/api/users', userRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Driver Booking API running");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Init websockets and start server
const PORT = process.env.PORT || 5000;
initSocket(server);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
