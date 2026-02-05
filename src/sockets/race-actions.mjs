import { clearInterval } from "timers";

export function registerRaceActions(socket, io, { raceState }) {
  //timers
  let ticTac = null;
  let timer = null;

  // ---- COUNTDOWN ----
  const startCountdown = (duration) => {
    console.log("Start countdown");
    raceState.timer.startedAt = Date.now();
    raceState.timer.running = true;
    raceState.timeLeft = duration;
    ticTac = setInterval(() => {
      raceState.timeLeft -= 1000;
      io.emit("tic-tac", raceState.timeLeft);
      //console.log("Race is on. Time left: " + raceState.timeLeft);
    }, 1000);
    timer = setTimeout(() => {
      finishRace();
      raceState.timeLeft = 0;
      raceState.timer.startedAt = null;
      raceState.timer.running = false;
      io.emit("tic-tac", raceState.timeLeft);

    }, duration);
  };
  // ---- RACE MODES MANAGEMENT ----
  socket.on("race:action", (action) => {
    if (socket.data.role !== "safety-official") {
      console.warn("Unauthorized action", socket.id);
      return;
    }

    if (
      !raceState.sessions.find((session) => session.status === "in progress") &&
      raceState.sessions.find((session) => session.status === "next") &&
      action.type === "START"
    ) {
      raceState.raceMode = "safe";

      //change next race status to in-progres
      raceState.sessions[
        raceState.sessions.findIndex((session) => session.status === "next")
      ].status = "in progress";

      console.log("START recieved:");
      console.log("Race state data:");
      console.log(raceState);

      //if more upcoming races, find next
      if (!raceState.sessions.find((session) => session.status === "next")) {
        if (
          raceState.sessions.find((session) => session.status === "upcoming")
        ) {
          const upcomingSessions = raceState.sessions.filter(
            (session) => session.status === "upcoming",
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
            "next";
          console.log("Updated next race:");
          console.log("Race state data:");
          console.log(raceState);
        }
      }

      //start timer
      startCountdown(raceState.duration);
      // --- TODO ---
      //The leader board changes to the current race.
      //The Next Race screen switches to the subsequent race session.

      io.emit("state:update", raceState);
    }

    //controls active when race is on
    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "GREEN_FLAG"
    ) {
      raceState.raceMode = "safe";
      console.log("green flag");
      console.log("Race state data:");
      console.log(raceState);
      io.emit("state:update", raceState);
    }

    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "YELLOW_FLAG"
    ) {
      raceState.raceMode = "hazard";
      console.log("yellow flag");
      console.log("Race state data:");
      console.log(raceState);
      io.emit("state:update", raceState);
    }

    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "RED_FLAG"
    ) {
      raceState.raceMode = "danger";
      console.log("red flag");
      console.log("Race state data:");
      console.log(raceState);
      io.emit("state:update", raceState);
    }

    if (
      raceState.sessions.find((session) => session.status === "in progress") &&
      action.type === "CHEQUERED_FLAG"
    ) {
      finishRace();
    }

    if (
      raceState.sessions.find((session) => session.status === "finished") &&
      action.type === "END_SESSION"
    ) {
      //change finished race status to closed
      raceState.sessions[
        raceState.sessions.findIndex((session) => session.status === "finished")
      ].status = "closed";
      raceState.raceMode = "danger";
      console.log("end session");
      console.log("Race state data:");
      console.log(raceState);
      io.emit("state:update", raceState);
    }
  });

    // ---- RECORD LAP TIME ----
    socket.on("race:lap", (data) => {
        if (socket.data.role !== "observer") return;
        const session = raceState.sessions.find(s => s.id === data.sessionId);
        if (!session || session.status === "closed") return;
        const driver = session.drivers.find(d => d.carNum === data.carNum);
        if (!driver) return;

        const now = Date.now();
        const startTime = driver.lastLapAt || raceState.timer.startedAt || now;
        const lapTime = now - startTime;

        driver.laps = (driver.laps || 0) + 1;
        driver.lastLapAt = now;

        // Logic for Fastest Lap
        if (!driver.fastestLap || lapTime < driver.fastestLap) {
            driver.fastestLap = lapTime;
        }

        console.log(`Lap recorded for Car ${data.carNum}: ${lapTime}ms`);
        io.emit("state:update", raceState); // Push update to Leaderboard!
    });

  // ---- FINISH RACE HELPER ----
  const finishRace = () => {
    raceState.raceMode = "finished";
    console.log("checkered flag");
    raceState.sessions[
      raceState.sessions.findIndex(
        (session) => session.status === "in progress",
      )
    ].status = "finished";
    raceState.timeLeft = 0;
    raceState.timer.startedAt = null;
    raceState.timer.running = false;
    io.emit("state:update", raceState);    
    clearInterval(ticTac);
    clearTimeout(timer);

    console.log("Race state data:");
    console.log(raceState);
  };
}
