import { MODE } from "../../shared/constants/raceModes.js";
import { ROLE } from "../../shared/constants/roles.js";
import { SOCKET_STATE } from "../../shared/constants/socketMessages.js";

const socket = io({
  autoConnect: false,
});

let raceMode = "";
const role = ROLE.PUBLIC;
socket.auth = { role };
socket.connect();

socket.on("connect_error", (err) => {
  console.log(err);
  const warning = document.getElementById("warnings");
  warning.innerHTML = "Connection error, no realtime data.";
  warning.classList.remove("hidden");
});

// --- Connection established ---
socket.on("auth:ok", (role) => {
  if (role === ROLE.PUBLIC) {
    // Request initial data
    socket.emit(SOCKET_STATE.REQUEST);

    // Hide warnings if exists
    try {
      const warning = document.getElementById("warnings");
      warning.innerHTML = "";
      warning.classList.add("hidden");
    } catch (err) {}
  }
});

//  ---RACE STATE UPDATED ---
socket.on(SOCKET_STATE.UPDATE, (state) => {
  //update race mode
  raceMode = state.raceMode;
  console.log(raceMode);
  //change flag color
  const flag = document.getElementById("flag");
  flag.classList.remove(MODE.SAFE, MODE.HAZARD, MODE.DANGER, MODE.FINISHED);
  flag.classList.add(raceMode);
});

// --- FULL SCREEN ---
const flag = document.getElementById("flag");
const fullScreenButton = document.getElementById("full-screen-button");
fullScreenButton.onclick = () => {
  flag.requestFullscreen();
};
