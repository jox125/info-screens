import "dotenv/config";
import { loadMockData } from "../dev-helpers/load-mock-data.mjs";
import { loadStateFromFile } from "./persist-state.mjs";

// env keys
export const RECEPTIONIST_KEY = process.env.RECEPTIONIST_KEY;
export const OBSERVER_KEY = process.env.OBSERVER_KEY;
export const SAFETY_KEY = process.env.SAFETY_KEY;

// Race state initial state (currently in memory)
export const raceState = {
  sessions: [],
  raceMode: "danger", // safe, hazard, danger, finish
  duration: 60000, // Only 1 min races for now
  timeLeft: 0, //time left 1s. interval
  timer: {
    startedAt: null,
    running: false,
  },
};
//bonus flag
export const PARAMS = {};


export function checkConfig() {
  if (!RECEPTIONIST_KEY || !OBSERVER_KEY || !SAFETY_KEY) {
    console.error("ERROR: Missing required environment variables.");
    process.exit(1);
  }
  
  //register CLI parameters
  PARAMS.isKeepOldRacesEnabled =
    process.argv.includes("--keep-old") || process.argv.includes("-k");
    //console.log(PARAMS);
  
  //In development mode load mock data
  if (process.env.NODE_ENV === "development") {
    loadStateFromFile(raceState, setDurationFromEnv());
    //ensure 1min duration
    //if (raceState.duration != 60000) raceState.duration = 60000;
    //check that timer data is correct
    //if (raceState.timeLeft === 0) raceState.timer.running = false;
    //if (!raceState.timer.running) raceState.timeLeft = 0;
    //console.log(raceState);
    //if no file or file empty, load mock data
    if (raceState.sessions.length < 1) {
      Object.assign(raceState, loadMockData());
      console.log("Mock race state data loaded:");
      console.log(raceState);
    } else {
      console.log("Race state loaded from file:");
      console.log(raceState);
    }

    console.log({
      NODE_ENV: process.env.NODE_ENV,
      RECEPTIONIST_KEY: process.env.RECEPTIONIST_KEY,
      OBSERVER_KEY: process.env.OBSERVER_KEY,
      SAFETY_KEY: process.env.SAFETY_KEY,
    });
  }
  if (process.env.NODE_ENV === "production") {
    loadStateFromFile(raceState, setDurationFromEnv());
  }
}

function setDurationFromEnv() {
  const ENV = process.env.NODE_ENV;
  if (ENV === "development") return { duration: 60000 }; // 1min races on dev env
  if (ENV === "production") return { duration: 600000 }; // 10min races on prod env
}
