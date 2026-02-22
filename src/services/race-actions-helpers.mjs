import { MODE } from "../shared/constants/raceModes.js";
import { SOCKET_STATE } from "../shared/constants/socketMessages.js";
import { STATUS } from "../shared/constants/status.js";

// ---- FINISH RACE HELPER ----
export function createFinishRace({ raceState, io }) {
  const finishRace = () => {
    const sessionToFinish = raceState.sessions.find(
      (session) => session.status === STATUS.IN_PROGRESS,
    );
    raceState.raceMode = MODE.FINISHED;
    console.log("checkered flag");
    sessionToFinish.status = STATUS.FINISHED;
    sessionToFinish.finishedAt = Date.now();
    raceState.timer.running = false;
    io.emit( SOCKET_STATE.UPDATE, raceState);    
  };
  return { finishRace };
}