import { countdown } from "../server.mjs";
import fs from "fs";
import { raceState } from "./config.mjs";

const defaultRaceState = {
  sessions: [],
  raceMode: "danger", // safe, hazard, danger, finish
  duration: 600000, // 10 min races 
  timeLeft: 0, //time left 1s. interval
  timer: {
    startedAt: null,
    running: false,
  },
};



export function loadStateFromFile (raceState) {
      try {
        const raw = fs.readFileSync("./src/config/race-state.json", "utf8");
        const persisted = JSON.parse(raw);
        Object.assign(raceState, defaultRaceState, persisted);
        console.log("file loaded...");
        console.log(raceState);
      } catch (err) {
        console.log("Load Failed", err);
        Object.assign(raceState, defaultRaceState);
        console.log ("defaults loaded: ");
        console.log (raceState);
      }

      // If race in progress, continue timer
      if (raceState.timer.running && raceState.timeLeft > 0) {
         countdown.startCountdown(raceState.timeLeft);
      }
}

export function saveStateToFile (raceState) {
    try {
        const json = JSON.stringify(raceState, null, 2);
        fs.writeFileSync("./src/config/race-state.json", json);
        //console.log("State saved.");
        
    } catch (err){
        console.log("Failed to save state: " + err);
    }

}