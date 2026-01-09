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
    const loginPanel = document.getElementById("login-panel");
    loginPanel.remove();

    // Request initial data
    socket.emit("state:request");
    socket.on("state:update", (state) => {
      Object.assign(raceState, state);
    });

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
    safeButton.innerHTML = "Safe";
    safeButton.onclick = () => {
      socket.emit("race:action", { type: "GREEN_FLAG" });
    };
    const hazardButton = document.createElement("button");
    hazardButton.innerHTML = "Hazard";
    hazardButton.onclick = () => {
      socket.emit("race:action", { type: "YELLOW_FLAG" });
    };
    const dangerButton = document.createElement("button");
    dangerButton.innerHTML = "Danger";
    dangerButton.onclick = () => {
      socket.emit("race:action", { type: "RED_FLAG" });
    };
    const finishButton = document.createElement("button");
    finishButton.innerHTML = "Finish";
    finishButton.onclick = () => {
      socket.emit("race:action", { type: "CHEQUERED_FLAG" });
    };

    raceControlButtonsContainer.appendChild(safeButton);
    raceControlButtonsContainer.appendChild(hazardButton);
    raceControlButtonsContainer.appendChild(dangerButton);
    raceControlButtonsContainer.appendChild(finishButton);
    panel.appendChild(controlPanel);
  }
});

socket.on("state:update", (state) => {
  Object.assign(raceState, state);
  // If no upcoming races
  if (raceState.sessions.length == 0) {
    try {
      const warning = document.getElementById("warning");
      warning.innerHTML = `
      <p>No upcoming races</p>
      <p>Add races from /front-desk</p>
      `;
      warning.classList.remove("hidden");
      //remove info about upcoming races
      const info = document.getElementById("next-info");
      info.innerHTML = ""; 
      //disable start button
      const startButton = document.getElementById("start-button");
      startButton.disabled = true;
    } catch (err) {
      console.log("Control panel not ready in no upcoming.");
    }
  }
  //upcoming race exists
  if (raceState.sessions.length > 0) {
    try {
      //hide warnings and enable start button
      const warning = document.getElementById("warning");
      warning.innerHTML = "";
      warning.classList.add("hidden");
      const startButton = document.getElementById("start-button");
      startButton.disabled = false;
      // Show info about upcoming race
      const info = document.getElementById("next-info");
      
        info.innerHTML = `
        <h4>Next race:</h4>
        <p>${raceState.sessions[0].name}</p>    
        <h4>Drivers:</h4>
        <div>${raceState.sessions[0].drivers
          .map((driver) => `<div>Name: ${driver.name}</div>`)
          .join("")}</div>
      `;
    } catch (err) {
      console.log("Control panel not ready in upcoming exists.");
    }
  }

  //race is started
  if (raceState.currentRace) {
    //disable start button , show race control buttons, show current race info
    try {
      const startButton = document.getElementById("start-button");
      startButton.disabled = true;

      const controlButtons = document.getElementById(
        "race-control-buttons-container"
      );
      controlButtons.classList.remove("hidden");

      const info = document.getElementById("current-info");
      info.innerHTML = `
        <h4>Current race:</h4>
        <p>${raceState.currentRace.name}</p>
        <h4>Drivers:</h4>
        <div>${raceState.currentRace.drivers
          .map((driver) => `<div>Name: ${driver.name}</div>`)
          .join("")}</div>
      `;
      const timer = document.getElementById("timer");
      if (timer.textContent.trim() === ""){
        timer.innerHTML = convertTime(raceState.duration);
      }
    } catch (err) {
      console.log("Control panel not ready in race started.");
    }
  }
  //race is finished
  if (!raceState.currentRace) {
    //enable start button and hide control buttons, clear current race info, clear timer
    try {
      const startButton = document.getElementById("start-button");
      startButton.disabled = false;
      //if no upcoming races disable start button
      if (raceState.sessions.length == 0){
        startButton.disabled = true;
      }
      const controlButtons = document.getElementById(
        "race-control-buttons-container"
      );
      controlButtons.classList.add("hidden");

      const info = document.getElementById("current-info");
      info.innerHTML = "";

      const timer = document.getElementById("timer");
      timer.innerHTML = "";
    } catch (err) {
      console.log("Control panel not ready in race finished.");
    }
  }
});

socket.on("tic-tac", (timeLeft) => {
  const timer = document.getElementById("timer");
  timer.innerHTML = convertTime(timeLeft);
});

const convertTime = (millis)=>{
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
};