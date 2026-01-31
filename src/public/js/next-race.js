const socket = io({
  autoConnect: false,
});
const raceState = {};

// --- Full screen ---
const screen = document.getElementById("panel");
const fullScreenButton = document.getElementById("full-screen-button");
fullScreenButton.onclick = () => {
  screen.style="border-radius:unset";
  screen.requestFullscreen();
  fullScreenButton.classList.add("hidden");  
};
document.addEventListener("fullscreenchange", () => {    
    if (document.fullscreenElement !== screen){        
        screen.style = "";
        fullScreenButton.classList.remove("hidden");
    }
});
