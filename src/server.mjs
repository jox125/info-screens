import express from "express";
import "dotenv/config";
import { static as serveStatic } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { clearInterval } from "timers";
import { loadMockData } from "./dev-helpers/load-mock-data.mjs";

// Initialize express, socketIO
const app = express();
const server = createServer(app);
const io = new Server(server);

//timers
let ticTac = null;
let timer = null;

// env keys
const RECEPTIONIST_KEY = process.env.RECEPTIONIST_KEY;
const OBSERVER_KEY = process.env.OBSERVER_KEY;
const SAFETY_KEY = process.env.SAFETY_KEY;

// Race state (currently in memory)
const raceState = {
  sessions: [],
  raceMode: "danger", // safe, hazard, danger, finish
  duration: 60000, // Only 1 min races for now
};

if (process.env.NODE_ENV === "development") {
  Object.assign(raceState, loadMockData());
  console.log({
    NODE_ENV: process.env.NODE_ENV,
    RECEPTIONIST_KEY: process.env.RECEPTIONIST_KEY,
    OBSERVER_KEY: process.env.OBSERVER_KEY,
    SAFETY_KEY: process.env.SAFETY_KEY,
  });
  console.log("Race state data:")
  console.log(raceState);
}

if (!RECEPTIONIST_KEY || !OBSERVER_KEY || !SAFETY_KEY) {
  console.error("ERROR: Missing required environment variables.");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(serveStatic("src/public"));
app.get("/race-control", (req, res) => {
  res.sendFile(join(__dirname, "/public/race-control.html"));
});

//add next race if no next race, and upcomings exist
if (!raceState.sessions.find((session) => session.status === "next")) {
  if (raceState.sessions.find((session) => session.status === "upcoming")) {
    const upcomingSessions = raceState.sessions.filter(
      (session) => session.status === "upcoming"
    );
    let nextSession = {};
    //find session with smallest id
    if (!upcomingSessions) {
    } else {
      nextSession.id = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < upcomingSessions.length; i++) {
        if (upcomingSessions[i].id < nextSession.id) {
          nextSession = upcomingSessions[i];
        }
      }
    }
    raceState.sessions[raceState.sessions.indexOf(nextSession)].status = "next";
    console.log("Updating next race:");
    console.log("Race state data:");
    console.log(raceState);
  }
}

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

    if (
      !raceState.sessions.find((session) => session.status === "in progress") &&
      raceState.sessions.find((session) => session.status === "next") &&
      action.type === "START"
    ) {
      raceState.raceMode = "safe";

      //change next race status to in progres
      raceState.sessions[
        raceState.sessions.findIndex((session) => session.status === "next")
      ].status = "in progress";

      console.log("START recieved:");
      console.log("Race state data:");
      console.log(raceState);

      //if more upcoming races, find next
      if (!raceState.sessions.find((session) => session.status === "next")) {
        if (
          raceState.sessions.find((session) => session.status === "upcoming")
        ) {
          const upcomingSessions = raceState.sessions.filter(
            (session) => session.status === "upcoming"
          );
          let nextSession = {};
          //find session with smallest id
          if (!upcomingSessions) {
          } else {
            nextSession.id = Number.MAX_SAFE_INTEGER;
            for (let i = 0; i < upcomingSessions.length; i++) {
              if (upcomingSessions[i].id < nextSession.id) {
                nextSession = upcomingSessions[i];
              }
            }
          }
          raceState.sessions[raceState.sessions.indexOf(nextSession)].status =
            "next";
          console.log("Updated next race:");
          console.log("Race state data:");
          console.log(raceState);
        }
      }

      //start timer
      startCountdown(raceState.duration);
      // --- TODO ---
      //The leader board changes to the current race.
      //The Next Race screen switches to the subsequent race session.

      io.emit("state:update", raceState);
    }

    //controlls active when race is on
    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "GREEN_FLAG"
    ) {
      raceState.raceMode = "safe";
      console.log("green flag");
      console.log("Race state data:");
      console.log(raceState);
      io.emit("state:update", raceState);
    }

    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "YELLOW_FLAG"
    ) {
      raceState.raceMode = "hazard";
      console.log("yellow flag");
      console.log("Race state data:");
      console.log(raceState);
      io.emit("state:update", raceState);
    }

    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "RED_FLAG"
    ) {
      raceState.raceMode = "danger";
      console.log("red flag");
      console.log("Race state data:");
      console.log(raceState);
      io.emit("state:update", raceState);
    }

    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "CHEQUERED_FLAG"
    ) {
      finishRace();
    }

    if (
      raceState.sessions.find((session) => session.status === "finished") &&
      action.type === "END_SESSION"
    ) {
      //change finished race status to closed
      raceState.sessions[
        raceState.sessions.findIndex((session) => session.status === "finished")
      ].status = "closed";
      raceState.raceMode = "danger";
      console.log("end session");
      console.log("Race state data:");
      console.log(raceState);
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

  socket.on("state:request", () => {
    socket.emit("state:update", raceState);
  });

  socket.on("session:request", () => {
    socket.emit("sessions:update", raceState.sessions);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  // ---- TIMER ----
  const startCountdown = (duration) => {
    console.log("Start countown");
    let timeLeft = duration;
    ticTac = setInterval(() => {
      timeLeft -= 1000;
      io.emit("tic-tac", timeLeft);
    }, 1000);
    timer = setTimeout(() => {
      finishRace();
      io.emit("tic-tac", 0);
    }, duration);
  };

  // ---- FINISH RACE ----
  const finishRace = () => {
    raceState.raceMode = "finished";
    console.log("checquered flag");
    raceState.sessions[
      raceState.sessions.findIndex(
        (session) => session.status === "in progress"
      )
    ].status = "finished";
    io.emit("state:update", raceState);
    clearInterval(ticTac);
    clearTimeout(timer);    
    
    console.log("Race state data:");
    console.log(raceState);
  };
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
