const { Server } = require("socket.io");

let ioInstance = null;

function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
  });

  ioInstance.on("connection", (socket) => {
    // Client should emit 'join' with either { userId } or { driverUserId }
    socket.on("join", (payload = {}) => {
      try {
        if (payload.userId) {
          socket.join(`user:${payload.userId}`);
        }
        if (payload.driverUserId) {
          socket.join(`driverUser:${payload.driverUserId}`);
        }
      } catch {}
    });

    socket.on("disconnect", () => {
      // No-op; rooms auto-clean up
    });
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
}

module.exports = { initSocket, getIO };
