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
const SAFETY_KEY = process.env.safety_key;

if (!SAFETY_KEY) {
  console.error("ERROR: Missing required environment variables.");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(serveStatic("src/public"));
app.get("/race-control", (req, res) => {
  res.sendFile(join(__dirname, "/public/race-control.html"));
})

// Race state (currently in memory)
const raceState = {
  sessions: [],
  currentRace: null,
  raceMode: "danger", // safe, hazard, danger, finish
  duration: 60000, // Only 1 min races for now
};

// Login states
const loginStates = {
  raceControl: false,
};

// Connect with client
io.on("connection", (socket) => {
  console.log("Client connected");

  // ---- RACE CONTROL LOGIN ----
  socket.on("race-control-login", (key) => {
    console.log("Key recieved: " + key);
    if (key !== SAFETY_KEY){
      loginStates.raceControl=false;     
      socket.emit("wrong-key");
    }
    else {
      loginStates.raceControl=true;
      socket.emit("correct-key");
    }  
  });

  // ---- RACE MODES MANAGEMENT ----
  socket.on("start-race", () => {
      if (loginStates.raceControl){
        raceState.raceMode = "safe";
        // --- TODO ---
        //The leader board changes to the current race.
        //The Next Race screen switches to the subsequent race session.
        socket.emit("start-confirmed");
        socket.on("safe", ()=>{
          raceState.raceMode = "safe";
        });
        socket.on("hazard", () => {
          raceState.raceMode = "hazard";
        });
        socket.on("danger", () => {
          raceState.raceMode = "danger";
        });
        socket.on("finish", () => {
          raceState.raceMode = "finish";
        });
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
