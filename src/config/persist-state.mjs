import { countdown } from "../server.mjs";
import fs from "fs";
import { DEFAULT_RACE_STATE } from "./raceState.mjs";

export function loadStateFromFile (raceState, duration) {
      try {
        const raw = fs.readFileSync("./src/config/race-state.json", "utf8");
        const persisted = JSON.parse(raw);
        Object.assign(raceState, DEFAULT_RACE_STATE, persisted, duration);
        console.log("Race State loaded from file:");
        console.log(raceState);
      } catch {
        console.log("File Load Failed");
        Object.assign(raceState, DEFAULT_RACE_STATE, duration);
        console.log ("Default race state loaded: ");
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