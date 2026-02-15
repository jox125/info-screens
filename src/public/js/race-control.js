import { ERROR_MESSAGES } from "./constants/messages.js";
import { ERROR_CODES } from "../../shared/constants/codes.js";

const socket = io({
  autoConnect: false,
});

const raceState = {};

const loginForm = document.getElementById("login-form");
const loginInput = document.getElementById("login-key");
const loginError = document.getElementById("login-error");
const panel = document.getElementById("panel");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (loginInput) {
    let key = loginInput.value.trim();
    let role = "safety-official";
    socket.auth = { role, key };
    socket.connect();
    loginInput.value = "";
  }
});

socket.on("connect_error", (err) => {
  console.log(err);
  loginError.innerHTML = "Wrong key";
  loginInput.disabled = true;
  loginInput.placeholder = "";
  window.setTimeout(() => {
    loginError.innerHTML = "";
    loginInput.disabled = false;
    loginInput.placeholder = "Please enter key";
  }, 500);
});

// ---- AUTH OK, LOAD control panel ----
socket.on("auth:ok", (role) => {
  if (role === "safety-official") {
    //clear view
    const oldControlPanel = document.getElementById("control-panel");
    if (oldControlPanel) oldControlPanel.remove();

    const loginPanel = document.getElementById("login-panel");
    if (loginPanel) loginPanel.remove();

    // Request initial data
    socket.emit("state:request");

    // Render Control Panel
    const controlPanel = document.createElement("div");
    controlPanel.id = "control-panel";
    controlPanel.classList.add("control-panel");

    //control panel warnings
    const warnings = document.createElement("div");
    warnings.id = "warning";
    warnings.classList.add("warning", "hidden");
    controlPanel.appendChild(warnings);

    //next Race Info
    const nextRaceInfo = document.createElement("div");
    nextRaceInfo.id = "next-info";
    nextRaceInfo.classList.add("info");
    controlPanel.appendChild(nextRaceInfo);

    //current Race info
    const currentRaceInfo = document.createElement("div");
    currentRaceInfo.id = "current-info";
    currentRaceInfo.classList.add("info");
    const raceTimer = document.createElement("div");
    raceTimer.id = "timer";
    raceTimer.classList.add("info");
    controlPanel.appendChild(currentRaceInfo);
    controlPanel.appendChild(raceTimer);

    //Start button
    const startButton = document.createElement("button");
    startButton.id = "start-button";
    startButton.innerHTML = "Start Race";
    startButton.onclick = () => {
      socket.emit("race:action", { type: "START" });
    };
    controlPanel.appendChild(startButton);

    //Control buttons
    const raceControlButtonsContainer = document.createElement("div");
    raceControlButtonsContainer.id = "race-control-buttons-container";
    raceControlButtonsContainer.classList.add("buttons-container", "hidden");
    controlPanel.appendChild(raceControlButtonsContainer);

    const safeButton = document.createElement("button");
    safeButton.innerHTML = `<span>Safe</span>`;
    safeButton.id = "safe-button";
    safeButton.classList.add("race-control-button");
    safeButton.onclick = () => {
      socket.emit("race:action", { type: "GREEN_FLAG" });
    };
    const hazardButton = document.createElement("button");
    hazardButton.innerHTML = `<span>Hazard</span>`;
    hazardButton.id = "hazard-button";
    hazardButton.classList.add("race-control-button");
    hazardButton.onclick = () => {
      socket.emit("race:action", { type: "YELLOW_FLAG" });
    };
    const dangerButton = document.createElement("button");
    dangerButton.innerHTML = `<span>Danger</span>`;
    dangerButton.id = "danger-button";
    dangerButton.classList.add("race-control-button");
    dangerButton.onclick = () => {
      socket.emit("race:action", { type: "RED_FLAG" });
    };
    const finishButton = document.createElement("button");
    finishButton.innerHTML = `<span>Finish</span>`;
    finishButton.id = "finish-button";
    finishButton.classList.add("race-control-button");
    finishButton.onclick = () => {
      socket.emit("race:action", { type: "CHEQUERED_FLAG" });
    };

    raceControlButtonsContainer.appendChild(safeButton);
    raceControlButtonsContainer.appendChild(hazardButton);
    raceControlButtonsContainer.appendChild(dangerButton);
    raceControlButtonsContainer.appendChild(finishButton);

    panel.appendChild(controlPanel);

    //End session button
    const endSessionButton = document.createElement("button");
    endSessionButton.id = "end-session-button";
    endSessionButton.classList.add("hidden");
    endSessionButton.innerHTML = "End Session";
    endSessionButton.onclick = () => {
      socket.emit("race:action", { type: "END_SESSION" });
    };
    controlPanel.appendChild(endSessionButton);

    //Race state indicator
    const stateIndicator = document.createElement("div");
    stateIndicator.id = "state-indicator";
    stateIndicator.classList.add("hidden");
    controlPanel.appendChild(stateIndicator);
  }
});

const updateView = (state) => {
  //update state data
  Object.assign(raceState, state);
  //change state indicator color
  const stateIndicator = document.getElementById("state-indicator");
  stateIndicator.classList.remove("safe", "hazard", "danger", "finished");
  stateIndicator.classList.add(raceState.raceMode);

  // view 1. no race on, and no next races
  if (
    !raceState.sessions.find((session) => session.status === "in progress") &&
    !raceState.sessions.find((session) => session.status === "next")
  ) {
    try {
      //remove info about upcoming races
      const nextInfo = document.getElementById("next-info");
      nextInfo.innerHTML = "";
      //remove info about current race
      const currentInfo = document.getElementById("current-info");
      currentInfo.innerHTML = "";
      const timer = document.getElementById("timer");
      timer.innerHTML = "";
      //disable start button, but show
      const startButton = document.getElementById("start-button");
      startButton.disabled = true;
      startButton.classList.remove("hidden");
      //disable and hide end Session button
      const endSessionButton = document.getElementById("end-session-button");
      endSessionButton.disabled = true;
      endSessionButton.classList.add("hidden");
      //show current state flag
      const stateIndicator = document.getElementById("state-indicator");
      stateIndicator.classList.remove("hidden");
    } catch (err) {
      console.log("Control panel not ready in no upcoming.");
    }
  }
  //view 2. no race in progress, no race in finished state, next waiting
  if (
    !raceState.sessions.find((session) => session.status === "in progress") &&
    !raceState.sessions.find((session) => session.status === "finished") &&
    raceState.sessions.find((session) => session.status === "next")
  ) {
    try {
      // hide current race info
      const currentInfo = document.getElementById("current-info");
      currentInfo.innerHTML = "";
      const timer = document.getElementById("timer");
      timer.innerHTML = "";
      //disable and hide End Session button
      const endSessionButton = document.getElementById("end-session-button");
      endSessionButton.disabled = true;
      endSessionButton.classList.add("hidden");
      //enable and show start button
      const startButton = document.getElementById("start-button");
      startButton.disabled = false;
      startButton.classList.remove("hidden");
      //show next race info
      const nextInfo = document.getElementById("next-info");
      nextInfo.classList.remove("hidden");
      const nextRace = raceState.sessions.find(
        (session) => session.status === "next",
      );
      nextInfo.innerHTML = `
        <h4>Next race:</h4>
        <p>${nextRace.name}</p>    
        <h4>Cars:</h4>
        <div>${nextRace.drivers
          .map(
            (driver) => `
            <div>
            <span><strong>Car nr: </strong>${driver.carNum}</span>
            <span><strong>Driver: </strong>${driver.name}</span>
            </div>
            `,
          )
          .join("")}</div>
      `;
    } catch (err) {
      console.log("Control panel not ready in no race in progress.");
    }
  }
  // view 3. race in progress
  if (raceState.sessions.find((session) => session.status === "in progress")) {
    try {
      //disable and hide start button
      const startButton = document.getElementById("start-button");
      startButton.disabled = true;
      startButton.classList.add("hidden");
      //show race control buttons
      const controlButtons = document.getElementById(
        "race-control-buttons-container",
      );
      controlButtons.classList.remove("hidden");
      //show current race info
      const info = document.getElementById("current-info");
      const currentRace = raceState.sessions.find(
        (session) => session.status === "in progress",
      );
      info.innerHTML = `
        <h4>Current race:</h4>
        <p>${currentRace.name}</p>
        <h4>Drivers:</h4>
        <div>${currentRace.drivers
          .map(
            (driver) => `
            <div>
            <span><strong>Car nr: </strong>${driver.carNum}</span>
            <span><strong>Driver: </strong>${driver.name}</span>
            </div>
            `,
          )
          .join("")}</div>
      `;
      //show timer
      const timer = document.getElementById("timer");
      if (timer.textContent.trim() === "") {
        timer.innerHTML = convertTime(raceState.timeLeft);
      }
      //hide next race info
      const nextRaceInfo = document.getElementById("next-info");
      nextRaceInfo.classList.add("hidden");
      nextRaceInfo.innerHTML = "";
      //show current state flag
      const stateIndicator = document.getElementById("state-indicator");
      stateIndicator.classList.remove("hidden");
    } catch (err) {
      console.log("Control panel not ready in race started.");
    }
  }
  //view 4. race is finished but session not jet
  if (
    !raceState.sessions.find((session) => session.status === "in progress") &&
    raceState.sessions.find((session) => session.status === "finished")
  ) {
    //hide control buttons, show end session button
    try {
      //disable and hide start button
      const startButton = document.getElementById("start-button");
      startButton.disabled = true;
      startButton.classList.add("hidden");
      //hide control buttons
      const controlButtons = document.getElementById(
        "race-control-buttons-container",
      );
      controlButtons.classList.add("hidden");
      //show End Session button
      const endSessionButton = document.getElementById("end-session-button");
      endSessionButton.classList.remove("hidden");
      endSessionButton.disabled = false;
      //show timer
      const timer = document.getElementById("timer");
      if (timer.textContent.trim() === "") {
        timer.innerHTML = convertTime(raceState.timeLeft);
      }
      //show current state flag
      const stateIndicator = document.getElementById("state-indicator");
      stateIndicator.classList.remove("hidden");
    } catch (err) {
      console.log("Control panel not ready in race finished.");
    }
  }
  console.log(raceState);
  //Show or hide no-next-race warning
  if (
    !raceState.sessions ||
    raceState.sessions.length < 1 ||
    !raceState.sessions.find((session) => session.status === "next")
  ) {
    try {
      //show no next race warning
      const warning = document.getElementById("warning");
      warning.innerHTML = ERROR_MESSAGES[ERROR_CODES.NO_NEXT_RACE];
      warning.classList.remove("hidden");
    } catch (err) {}
  } else {
    //hide no next race warning
    try {
      const warning = document.getElementById("warning");
      warning.innerHTML = "";
      warning.classList.add("hidden");
    } catch (err) {}
  }
};

socket.on("session:update", (sessions) => {
  raceState.sessions = sessions;
  updateView(raceState);
});
socket.on("state:update", (state) => {
  updateView(state);
});

socket.on("tic-tac", (timeLeft) => {
  const timer = document.getElementById("timer");
  timer.innerHTML = convertTime(timeLeft);
});

const convertTime = (millis) => {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
};
