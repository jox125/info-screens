import { STATUS } from "../shared/constants/status.js";

//Helper to choose ordering number
const getOrderTs = (session) => {
  const confirmed = Number(session.confirmedAt);
  if (Number.isFinite(confirmed)) return confirmed;

  const created = Number(session.createdAt);
  if (Number.isFinite(created)) return created;

  const id = Number(session.id);
  if (Number.isFinite(id)) return id;

  return Number.MAX_SAFE_INTEGER;
};

export function ensureNextRace(raceState) {
  //add next race if no next race, and atleast one upcoming exists
  if (!raceState.sessions.find((session) => session.status === STATUS.NEXT)) {
    if (
      raceState.sessions.find((session) => session.status === STATUS.CONFIRMED)
    ) {
      const upcomingSessions = raceState.sessions.filter(
        (session) => session.status === STATUS.CONFIRMED,
      );

      const nextSession = [...upcomingSessions].sort(
        (a, b) => getOrderTs(a) - getOrderTs(b),
      )[0];
      nextSession.status = STATUS.NEXT;
      console.log("Updating raceState ... next race is: " + nextSession.name);
    }
  }
}
