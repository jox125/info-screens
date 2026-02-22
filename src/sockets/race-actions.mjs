import {
  SOCKET_COUNTDOWN,
  SOCKET_STATE,
  SOCKET_RACE,
  RACE_ACTION,
} from "../shared/constants/socketMessages.js";
import { countdown, finishRace } from "../server.mjs";
import { saveStateToFile } from "../config/persist-state.mjs";
import { params } from "../config/config.mjs";
import { ensureNextRace } from "../services/race-state.mjs";
import { ROLE } from "../shared/constants/roles.js";
import { STATUS } from "../shared/constants/status.js";
import { MODE } from "../shared/constants/raceModes.js";

export function registerRaceActions(socket, io, { raceState }) {
  // ---- RACE MODES MANAGEMENT ----
  socket.on(SOCKET_RACE.ACTION, (action) => {
    //check credentials
    if (socket.data.role !== ROLE.SAFETY_OFFICIAL) {
      console.warn("Unauthorized action", socket.id);
      return;
    }
    const inProgressSession = raceState.sessions.find(
      (session) => session.status === STATUS.IN_PROGRESS,
    );
    const nextSession = raceState.sessions.find(
      (session) => session.status === STATUS.NEXT,
    );
    const finishedSession = raceState.sessions.find(
      (session) => session.status === STATUS.FINISHED,
    );

    switch (action.type) {
      //Start session
      case RACE_ACTION.START:
        if (!inProgressSession && nextSession) {
          console.log("START recieved:");
          raceState.raceMode = MODE.SAFE;
          //change next race status to in-progres
          nextSession.status = STATUS.IN_PROGRESS;
          nextSession.startedAt = Date.now();
          //if more upcoming races, find next
          ensureNextRace(raceState);
          //start timer
          countdown.startCountdown(raceState.duration);
          io.emit(SOCKET_STATE.UPDATE, raceState);
        }
        break;
      //Green Flag
      case RACE_ACTION.GREEN_FLAG:
        if (inProgressSession) {
          raceState.raceMode = MODE.SAFE;
          console.log("Green flag");
          io.emit(SOCKET_STATE.UPDATE, raceState);
        }
        break;
      //Yellow Flag
      case RACE_ACTION.YELLOW_FLAG:
        if (inProgressSession) {
          raceState.raceMode = MODE.HAZARD;
          console.log("yellow flag");
          io.emit(SOCKET_STATE.UPDATE, raceState);
        }
        break;
      //Red Flag
      case RACE_ACTION.RED_FLAG:
        if (inProgressSession) {
          raceState.raceMode = MODE.DANGER;
          console.log("red flag");
          io.emit(SOCKET_STATE.UPDATE, raceState);
        }
        break;
      //Chequered Flag
      case RACE_ACTION.CHEQUERED_FLAG:
        if (inProgressSession) {
          countdown.stopCountdown();
          finishRace.finishRace();
        }
        break;
      //End Session
      case RACE_ACTION.END_SESSION:
        if (finishedSession) {
          //if keep-old enabled change finished race status to closed
          //else delete
          if (params.isKeepOldRacesEnabled) {
            finishedSession.status = STATUS.CLOSED;
            finishedSession.closedAt = Date.now();
            console.log("Session closed.");
          } else {
            raceState.sessions = raceState.sessions.filter(
              (s) => s.id !== finishedSession.id,
            );
            console.log("Session deleted.");
          }
          raceState.timeLeft = 0;
          raceState.raceMode = MODE.DANGER;
          console.log("end session");
          io.emit(SOCKET_STATE.UPDATE, raceState);
          io.emit(SOCKET_COUNTDOWN.UPDATE, raceState.duration);
        }
        break;
      default:
        console.log("action not found");
    }

    //Save state
    saveStateToFile(raceState);
  });

  // ---- RECORD LAP TIME ----
  socket.on(SOCKET_RACE.LAP, (data) => {
    if (socket.data.role !== ROLE.OBSERVER) return;
    const session = raceState.sessions.find((s) => s.id === data.sessionId);
    if (!session || session.status === STATUS.CLOSED) return;
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
    io.emit(SOCKET_STATE.UPDATE, raceState); // Push update to Leaderboard!
    //Save state
    saveStateToFile(raceState);
  });
}
