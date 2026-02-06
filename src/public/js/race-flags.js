const socket = io({
  autoConnect: false,
});

let raceMode = "";
const role = "public";
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
  if (role === "public") {
    // Request initial data
    socket.emit("state:request");

    // Hide warnings if exists
    try {
      const warning = document.getElementById("warnings");
      warning.innerHTML = "";
      warning.classList.add("hidden");
    } catch (err) {}
  }
});

//  ---RACE STATE UPDATED ---
socket.on("state:update", (state) => {
  //update race mode
  raceMode = state.raceMode;
  console.log(raceMode);
  //change flag color
  const flag = document.getElementById("flag");
  flag.classList.remove("safe", "hazard", "danger", "finished");
  flag.classList.add(raceMode);
});

// --- FULL SCREEN ---
const flag = document.getElementById("flag");
const fullScreenButton = document.getElementById("full-screen-button");
fullScreenButton.onclick = () => {
  flag.requestFullscreen();
};
