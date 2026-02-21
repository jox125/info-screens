// ---- FINISH RACE HELPER ----
export function createFinishRace({ raceState, io }) {
  const finishRace = () => {
    raceState.raceMode = "finished";
    console.log("checkered flag");
    raceState.sessions[
      raceState.sessions.findIndex(
        (session) => session.status === "in progress",
      )
    ].status = "finished";
    raceState.timer.running = false;
    io.emit("state:update", raceState);
  };
  return { finishRace };
}