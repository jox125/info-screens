const socket = io();

const loginForm = document.getElementById("login-form");
const loginInput = document.getElementById("login-key");
const loginError = document.getElementById("login-error");
const panel = document.getElementById("panel");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (loginInput) {
    socket.emit("race-control-login", loginInput.value);
    loginInput.value = "";
  }
});
socket.on("wrong-key", () => {
  loginError.innerHTML = "Wrong key";
  loginInput.disabled = true;
  loginInput.placeholder = "";
  window.setTimeout(enableLogin, 500);
});
const enableLogin = () => {
  loginError.innerHTML = "";
  loginInput.disabled = false;
  loginInput.placeholder = "Please enter key";
};
socket.on("correct-key", () => {
  const loginPanel = document.getElementById("login-panel");
  loginPanel.remove();

  const raceModeControlPanel = document.createElement("div");
  raceModeControlPanel.id = "control-panel";
  raceModeControlPanel.classList.add("control-panel");

  const startButton = document.createElement("button");
  startButton.id = "start-button";
  startButton.innerHTML = "Start Race";
  startButton.onclick = () => {
    socket.emit("start-race");
  };

  raceModeControlPanel.appendChild(startButton);

  panel.appendChild(raceModeControlPanel);

  socket.on("start-confirmed", () => {
    const startButton = document.getElementById("start-button");
    startButton.remove();

    const raceControlButtonsContainer = document.createElement("div");
    raceControlButtonsContainer.id = "race-control-buttons-container";
    raceControlButtonsContainer.classList.add("buttons-container");
    panel.appendChild(raceControlButtonsContainer);

    const safeButton = document.createElement("button");
    safeButton.innerHTML = "Safe";
    safeButton.onclick = () => {
      socket.emit("safe");
    };
    const hazardButton = document.createElement("button");
    hazardButton.innerHTML = "Hazard";
    hazardButton.onclick = () => {
      socket.emit("hazard");
    };
    const dangerButton = document.createElement("button");
    dangerButton.innerHTML = "Danger";
    dangerButton.onclick = () => {
      socket.emit("danger");
    };
    const finishButton = document.createElement("button");
    finishButton.innerHTML = "Finish";
    finishButton.onclick = () => {
      socket.emit("finish");
    };

    raceControlButtonsContainer.appendChild(safeButton);
    raceControlButtonsContainer.appendChild(hazardButton);
    raceControlButtonsContainer.appendChild(dangerButton);
    raceControlButtonsContainer.appendChild(finishButton);
  });
});
