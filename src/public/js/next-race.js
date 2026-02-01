const socket = io({
  autoConnect: false,
});

const raceState = {};
const role = "public";
socket.auth = { role };
socket.connect();

socket.on("connect_error", (err) => {
  console.log(err);
  const warning = document.getElementById("warnings");
  warning.innerHTML = "Connection error, no realtime data."
  warning.classList.remove("hidden");

});// --- FULL SCREEN ---
const screen = document.getElementById("panel");
const fullScreenButton = document.getElementById("full-screen-button");
fullScreenButton.onclick = () => {
  screen.style = "border-radius:unset";
  screen.requestFullscreen();
  fullScreenButton.classList.add("hidden");
};
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement !== screen) {
    screen.style = "";
    fullScreenButton.classList.remove("hidden");
  }
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
    } catch (err){}

  }
});