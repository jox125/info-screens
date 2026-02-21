export const DEFAULT_RACE_STATE = {
  sessions: [],
  raceMode: "danger", // safe, hazard, danger, finished
  duration: 600000, // 10 min races
  timeLeft: 0, //time left 1s. interval
  timer: {
    startedAt: null,
    running: false,
  },
};

export const raceState = { ...DEFAULT_RACE_STATE };