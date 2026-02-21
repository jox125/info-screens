import { SOCKET_COUNTDOWN } from "../shared/constants/socketMessages.js";
import { countdown, finishRace } from "../server.mjs";
import { saveStateToFile } from "../config/persist-state.mjs";
import { params } from "../config/config.mjs";
import { ensureNextRace } from "../services/race-state.mjs";

export function registerRaceActions(socket, io, { raceState }) {
  // ---- RACE MODES MANAGEMENT ----
  socket.on("race:action", (action) => {
    //check credentials
    if (socket.data.role !== "safety-official") {
      console.warn("Unauthorized action", socket.id);
      return;
    }

    //Start session
    if (
      !raceState.sessions.find((session) => session.status === "in progress") &&
      raceState.sessions.find((session) => session.status === "next") &&
      action.type === "START"
    ) {
      raceState.raceMode = "safe";

      //change next race status to in-progres
      raceState.sessions[
        raceState.sessions.findIndex((session) => session.status === "next")
      ].status = "in progress";
      console.log("START recieved:");

      //if more upcoming races, find next
      ensureNextRace(raceState);

      //start timer
      countdown.startCountdown(raceState.duration);

      io.emit("state:update", raceState);
    }

    //Gren Flag
    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "GREEN_FLAG"
    ) {
      raceState.raceMode = "safe";
      console.log("green flag");
      io.emit("state:update", raceState);
    }

    //Yellow Flag
    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "YELLOW_FLAG"
    ) {
      raceState.raceMode = "hazard";
      console.log("yellow flag");
      io.emit("state:update", raceState);
    }

    //Red Flag
    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "RED_FLAG"
    ) {
      raceState.raceMode = "danger";
      console.log("red flag");
      io.emit("state:update", raceState);
    }

    //Chequered Flag
    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "CHEQUERED_FLAG"
    ) {
      countdown.stopCountdown();
      finishRace.finishRace();
    }

    //End Session
    if (
      raceState.sessions.find((session) => session.status === "finished") &&
      action.type === "END_SESSION"
    ) {
      //if keep-old enabled change finished race status to closed
      //else delete
      if (params.isKeepOldRacesEnabled) {
        raceState.sessions[
          raceState.sessions.findIndex(
            (session) => session.status === "finished",
          )
        ].status = "closed";
        console.log("Session closed.");
      } else {
        raceState.sessions.splice(
          raceState.sessions.findIndex(
            (session) => session.status === "finished",
          ),
          1,
        );
        console.log("Session deleted.");
      }

      raceState.timeLeft = 0;
      raceState.raceMode = "danger";
      console.log("end session");
      io.emit("state:update", raceState);
      io.emit(SOCKET_COUNTDOWN.UPDATE, raceState.duration);
    }
    //Save state
    saveStateToFile(raceState);
  });

  // ---- RECORD LAP TIME ----
  socket.on("race:lap", (data) => {
    if (socket.data.role !== "observer") return;
    const session = raceState.sessions.find((s) => s.id === data.sessionId);
    if (!session || session.status === "closed") return;
    const driver = session.drivers.find((d) => d.carNum === data.carNum);
    if (!driver) return;

    const now = Date.now();
    const startTime = driver.lastLapAt || raceState.timer.startedAt || now;
    const lapTime = now - startTime;

    driver.laps = (driver.laps || 0) + 1;
    driver.lastLapAt = now;

    // Logic for Fastest Lap
    if (!driver.fastestLap || lapTime < driver.fastestLap) {
      driver.fastestLap = lapTime;
    }

    console.log(`Lap recorded for Car ${data.carNum}: ${lapTime}ms`);
    io.emit("state:update", raceState); // Push update to Leaderboard!
    //Save state
    saveStateToFile(raceState);
  });
}
