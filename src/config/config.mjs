import "dotenv/config";
import { loadMockData } from "../dev-helpers/load-mock-data.mjs";
import { loadStateFromFile } from "./persist-state.mjs";
import { raceState } from "./raceState.mjs";

// env keys
export const RECEPTIONIST_KEY = process.env.RECEPTIONIST_KEY;
export const OBSERVER_KEY = process.env.OBSERVER_KEY;
export const SAFETY_KEY = process.env.SAFETY_KEY;

//bonus flag
export const params = {};


export function checkConfig() {
  if (!RECEPTIONIST_KEY || !OBSERVER_KEY || !SAFETY_KEY) {
    console.error("ERROR: Missing required environment variables.");
    process.exit(1);
  }
  
  //register CLI parameters
  params.isKeepOldRacesEnabled =
    process.argv.includes("--keep-old") || process.argv.includes("-k");
    //console.log(PARAMS);
  
  //In development mode load mock data
  if (process.env.NODE_ENV === "development") {
    loadStateFromFile(raceState, setDurationFromEnv());
    //if no file or file empty, load mock data
    if (raceState.sessions.length < 1) {
      Object.assign(raceState, loadMockData());
      console.log("Mock race state data loaded:");
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
