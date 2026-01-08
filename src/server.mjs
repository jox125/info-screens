import express from "express";
import "dotenv/config";
import { static as serveStatic } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Initialize express, socketIO
const app = express();
const server = createServer(app);
const io = new Server(server);

// env keys
const RECEPTIONIST_KEY = process.env.receptionist_key;
const OBSERVER_KEY = process.env.observer_key;
const SAFETY_KEY = process.env.safety_key;

if (!RECEPTIONIST_KEY || !OBSERVER_KEY || !SAFETY_KEY) {
  console.error("ERROR: Missing required environment variables.");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(serveStatic("src/public"));
app.get("/race-control", (req, res) => {
  res.sendFile(join(__dirname, "/public/race-control.html"));
});

// Race state (currently in memory)
const raceState = {
  sessions: [],
  currentRace: null,
  raceMode: "danger", // safe, hazard, danger, finish
  raceOn: false,
  duration: 60000, // Only 1 min races for now
};

// ---- AUTH get key on handshake and set role or deny connect ----
io.use((socket, next) => {
  const { role, key } = socket.handshake.auth;

  if (role === "public") {
    socket.data.role = "public";
    return next();
  }
  if (!key) {
    return next(new Error("Key required"));
  }
  if (role === "receptionist" && key === RECEPTIONIST_KEY) {
    socket.data.role = "receptionist";
    return next();
  }
  if (role === "observer" && key === OBSERVER_KEY) {
    socket.data.role = "observer";
    return next();
  }
  if (role === "safety-official" && key === SAFETY_KEY) {
    socket.data.role = "safety-official";
    return next();
  }

  return next(new Error("Unauthorized"));
});

// Connect with client
io.on("connection", (socket) => {
  console.log("Client connected");
  console.log(socket.data.role);

  socket.emit("auth:ok", socket.data.role);

  // ---- RACE MODES MANAGEMENT ----
  socket.on("race:action", (action) => {
    if (socket.data.role !== "safety-official") {
      console.warn("Unauthorized action", socket.id);
      return;
    }

    if (action.type === "START") {
      raceState.raceMode = "safe";
      raceState.raceOn = true;
      // --- TODO ---
      //The leader board changes to the current race.
      //The Next Race screen switches to the subsequent race session.
      io.emit("state:update", raceState);
    }

    if (action.type === "GREEN_FLAG") {
      raceState.raceMode = "safe";
      console.log("green flag");
      io.emit("state:update", raceState);
    }

    if (action.type === "YELLOW_FLAG") {
      raceState.raceMode = "hazard";
      console.log("yellow flag");
      io.emit("state:update", raceState);
    }

    if (action.type === "RED_FLAG") {
      raceState.raceMode = "danger";      
      console.log("red flag");
      io.emit("state:update", raceState);
    }

    if (action.type === "CHEQUERED_FLAG") {
      raceState.raceMode = "finish";
      console.log("checquered flag");
      io.emit("state:update", raceState);
    }
  });

  // ---- SESSION MANAGEMENT ----

  // Adding a session
  socket.on("session:add", (data) => {
    const session = {
      name: data.name,
      drivers: [],
      status: "upcoming",
    };
    raceState.sessions.push(session);
    io.emit("sessions:update", raceState.sessions);

    // For debugging
    console.log(raceState);
  });

  // ---- REQUESTS ----

  socket.on("session:request", () => {
    socket.emit("sessions:update", raceState.sessions);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
