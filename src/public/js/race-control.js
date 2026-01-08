const socket = io({
  autoConnect: false,
});

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

socket.on("auth:ok", (role) => {
  if (role === "safety-official"){
    const loginPanel = document.getElementById("login-panel");
    loginPanel.remove();

    const raceModeControlPanel = document.createElement("div");
    raceModeControlPanel.id = "control-panel";
    raceModeControlPanel.classList.add("control-panel");

    const startButton = document.createElement("button");
    startButton.id = "start-button";
    startButton.innerHTML = "Start Race";
    startButton.onclick = () => {
      socket.emit("race:action", { type:"START" });
    };

    raceModeControlPanel.appendChild(startButton);

    panel.appendChild(raceModeControlPanel);

    socket.on("state:update", (raceState) => {
      if (raceState.raceOn){
        const startButton = document.getElementById("start-button");
        startButton.remove();

        const raceControlButtonsContainer = document.createElement("div");
        raceControlButtonsContainer.id = "race-control-buttons-container";
        raceControlButtonsContainer.classList.add("buttons-container");
        panel.appendChild(raceControlButtonsContainer);

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
      }
    });
  };
});