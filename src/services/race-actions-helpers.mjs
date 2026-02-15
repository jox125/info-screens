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
    //raceState.timeLeft = 0;
    raceState.timer.startedAt = null;
    raceState.timer.running = false;
    io.emit("state:update", raceState);

    console.log("Race state data:");
    console.log(raceState);
  };
  return { finishRace };
}