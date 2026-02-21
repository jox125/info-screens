import { MODE } from "../shared/constants/raceModes.js";
import { SOCKET_STATE } from "../shared/constants/socketMessages.js";
import { STATUS } from "../shared/constants/status.js";

// ---- FINISH RACE HELPER ----
export function createFinishRace({ raceState, io }) {
  const finishRace = () => {
    raceState.raceMode = MODE.FINISHED;
    console.log("checkered flag");
    raceState.sessions[
      raceState.sessions.findIndex(
        (session) => session.status === STATUS.IN_PROGRESS,
      )
    ].status = STATUS.FINISHED;
    raceState.timer.running = false;
    io.emit( SOCKET_STATE.UPDATE, raceState);
  };
  return { finishRace };
}