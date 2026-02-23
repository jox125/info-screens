import { STATUS } from "../shared/constants/status.js";

export function loadMockData() {
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
        status: STATUS.CONFIRMED, // upcoming, upcoming-confirmed, next, in progress, finished, closed
        confirmedAt: 1771772590139,
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
        status: STATUS.CONFIRMED, // upcoming, upcoming-confirmed, next, in progress, finished, closed
        confirmedAt: 1771772590140,
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
        status: STATUS.CONFIRMED, // upcoming, upcoming-confirmed, next, in progress, finished, closed
        confirmedAt: 1771772590141,
      },
    ],
  };
}
