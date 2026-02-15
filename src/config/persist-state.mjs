import { countdown } from "../server.mjs";

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
        const raw = fs.readFileSync("race-state.json", "utf8");
        const persisted = JSON.parse(raw);
        Object.assign(raceState, defaultRaceState, persisted);
      } catch {
        Object.assign(raceState, defaultRaceState);
      }

      // If race in progress, continue timer
      if (raceState.timer.running && raceState.timeLeft > 0) {
         countdown.startCountdown(raceState.timeLeft);
      }
}