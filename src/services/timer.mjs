import { saveStateToFile } from "../config/persist-state.mjs";



export function createCountdown({ raceState, io, finishRace }) {
  //timers
  let ticTac = null;
  let timer = null;

  // ---- COUNTDOWN ----
  const startCountdown = (duration) => {
    //prevent restart if already started
    if (ticTac || timer) return;

    raceState.timer.startedAt = Date.now();
    raceState.timer.running = true;
    raceState.timeLeft = duration;
    ticTac = setInterval(() => {
      raceState.timeLeft -= 1000;
      io.emit("tic-tac", raceState.timeLeft);     
      //Save state
      saveStateToFile(raceState);
    }, 1000);

    timer = setTimeout(() => {
      finishRace.finishRace();
      raceState.timeLeft = 0;
      //raceState.timer.startedAt = null;
      raceState.timer.running = false;
      io.emit("tic-tac", raceState.timeLeft);
      clearInterval(ticTac);
      ticTac = null;
      timer = null;

      io.emit("tic-tac", 0);
    }, duration);
  };
  const stopCountdown = () => {
    if (ticTac) clearInterval(ticTac);
    if (timer) clearTimeout(timer);

    ticTac = null;
    timer = null;

    raceState.timer.running = false;
  };

  return {
    startCountdown,
    stopCountdown,
  };
}
