import { ROLE } from "../../shared/constants/roles.js";
import { SOCKET_COUNTDOWN } from "../../shared/constants/socketMessages.js";

const socket = io({
    auth: {
        role: ROLE.PUBLIC
    }
});

const countdown = document.getElementById("race-countdown");
const fsElement = document.getElementById("fullscreen-element");
const fsButton = document.getElementById("fullscreen-button");

// Updates countdown on page load or when race-control ends session
socket.emit(SOCKET_COUNTDOWN.REQUEST);
socket.on(SOCKET_COUNTDOWN.UPDATE, (timeLeft) => {
    countdown.textContent = convertTime(timeLeft);
});

socket.on("tic-tac", (timeLeft) => {
    countdown.textContent = convertTime(timeLeft);
});

// Allows to enter fullscreen
fsButton.addEventListener("click", (e) => {
    if(!document.fullscreenElement) {
        fsElement.requestFullscreen().catch(err => {
            console.log("Error enabling fullscreen:", err);
        });
        fsButton.classList.add("hidden");
    } else {
        document.exitFullscreen();
    }
});

// Unhides fullscreen button after exiting fullscreen
document.addEventListener("fullscreenchange", () => {
    if(!document.fullscreenElement) {
        fsButton.classList.remove("hidden");
    }
});


// Converts milliseconds to mm:ss
function convertTime(timeLeft) {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}