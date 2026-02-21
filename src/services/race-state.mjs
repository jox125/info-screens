import { STATUS } from "../shared/constants/status.js";

export function ensureNextRace(raceState) {
  //add next race if no next race, and upcomings exist
  if (!raceState.sessions.find((session) => session.status === STATUS.NEXT)) {
    if (
      raceState.sessions.find((session) => session.status === STATUS.UPCOMING)
    ) {
      const upcomingSessions = raceState.sessions.filter(
        (session) => session.status === STATUS.UPCOMING,
      );
      let nextSession = {};
      //find session with smallest id
      if (!upcomingSessions) {
      } else {
        nextSession.id = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < upcomingSessions.length; i++) {
          if (upcomingSessions[i].id < nextSession.id) {
            nextSession = upcomingSessions[i];
          }
        }
      }
      raceState.sessions[raceState.sessions.indexOf(nextSession)].status =
        STATUS.NEXT;
      console.log(
        "Updating raceState ... next race is: " +
          raceState.sessions.find((session) => session.status === STATUS.NEXT)
            .name,
      );
    }
  }
}
