import express from "express";
import "dotenv/config";
import { static as serveStatic } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { RECEPTIONIST_KEY, OBSERVER_KEY, SAFETY_KEY, checkConfig } from "./config/config.mjs";
import { raceState } from "./config/raceState.mjs";
import { ensureNextRace } from "./services/race-state.mjs";
import { socketAuth } from "./sockets/auth.mjs";
import { registerSocketHandlers } from "./sockets/index.mjs";
import { createCountdown } from "./services/timer.mjs";
import { createFinishRace } from "./services/race-actions-helpers.mjs";
import { saveStateToFile } from "./config/persist-state.mjs";

// Initialize express, socketIO
const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = fileURLToPath(dirname(import.meta.url));

// Initialize Finish Race Helper
export const finishRace = createFinishRace( { raceState, io } );
// Initialize timer
export const countdown = createCountdown( { raceState, io, finishRace } );

// Check Config
checkConfig();

//register endpoints
app.use(serveStatic("src/public"));
app.use("/shared", serveStatic("src/shared"));

app.get("/race-control", (req, res) => {
  res.sendFile(join(__dirname, "/public/race-control.html"));
});

app.get("/front-desk", (req, res) => {
    res.sendFile(join(__dirname, "/public/front-desk.html"));
});

app.get("/race-countdown", (req, res) => {
  res.sendFile(join(__dirname, "/public/race-countdown.html"));
});

app.get("/next-race", (req, res) => {
  res.sendFile(join(__dirname, "/public/next-race.html"));
});

app.get("/lap-line-tracker", (req, res) => {
    res.sendFile(join(__dirname, "/public/lap-line-tracker.html"));
});

app.get("/race-flags", (req, res) => {
  res.sendFile(join(__dirname, "/public/race-flags.html"));
});

app.get("/leader-board", (req, res) => {
    res.sendFile(join(__dirname, "/public/leaderboard.html"));

});

//Mark race with smallest id to be next race
ensureNextRace(raceState);

//Authenticate session
io.use(socketAuth( RECEPTIONIST_KEY, OBSERVER_KEY, SAFETY_KEY ));

// register Socket Handlers
io.use(registerSocketHandlers(io, { raceState }));


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});

//Save state on server stop
process.on("SIGINT", () => {
  saveStateToFile(raceState);
  process.exit(0);
});

process.on("SIGTERM", () => {
  saveStateToFile(raceState);
  process.exit(0);
});

