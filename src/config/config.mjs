import "dotenv/config";
import { loadMockData } from "../dev-helpers/load-mock-data.mjs";

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

export function checkConfig(){
    if (!RECEPTIONIST_KEY || !OBSERVER_KEY || !SAFETY_KEY) {
    console.error("ERROR: Missing required environment variables.");
    process.exit(1);
    }
    //In development mode load mock data
    if (process.env.NODE_ENV === "development") {
    Object.assign(raceState, loadMockData());
    console.log({
        NODE_ENV: process.env.NODE_ENV,
        RECEPTIONIST_KEY: process.env.RECEPTIONIST_KEY,
        OBSERVER_KEY: process.env.OBSERVER_KEY,
        SAFETY_KEY: process.env.SAFETY_KEY,
    });
    console.log("Mock race state data loaded:");
    console.log(raceState);
    }
}

