export function loadMockData () {
  // example races
  return {
    sessions: [
      {
        id: 1,
        name: "Very long race name that must scroll Race nr 1",
        drivers: [
          {
            id: 1,
            name: "Driver 1",
            carNum: 11,
          },
          {
            id: 2,
            name: "Driver 2",
            carNum: 22,
          },
        ],
        status: "upcoming", // upcoming, next, in progress, finished, closed
      },
      {
        id: 2,
        name: "Race nr 2",
        drivers: [
          {
            id: 1,
            name: "Driver 3",
            carNum: 33,
          },
          {
            id: 2,
            name: "Driver 4",
            carNum: 44,
          },
        ],
        status: "upcoming", // upcoming, next, in progress, finished, closed
      },
      {
        id: 3,
        name: "Race nr 3",
        drivers: [
          {
            id: 1,
            name: "Driver 5",
            carNum: 55,
          },
          {
            id: 2,
            name: "Driver 6",
            carNum: 66,
          },
        ],
        status: "upcoming", // upcoming, next, in progress, finished, closed
      },
    ],
    //currentRace: null,
    //nextRace: null,
    raceMode: "danger", // safe, hazard, danger, finish
    duration: 60000, // Only 1 min races for now
  };
}