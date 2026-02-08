import { ERROR_CODES } from "../../shared/constants/codes.js";
import { ERROR_MESSAGES } from "./constants/messages.js";

const socket = io({
  autoConnect: false,
});

const nextRace = {};
const role = "public";
socket.auth = { role };
socket.connect();

socket.on("connect_error", (err) => {
  console.log(err);
  const warning = document.getElementById("warnings");
  warning.innerHTML = "Connection error, no realtime data.";
  warning.classList.remove("hidden");
});

// ---- SCROLLING TEXT ----
//Check for need to scroll
function checkOverflow(id) {
  try {
    const element = document.getElementById(id);
    if (element.scrollWidth > element.parentElement.offsetWidth) {
      scrollText(id);
    } else {
      endScroll(id);
    }
  } catch (err) {
    console.log("Error in checkOverflow:");
    console.log(err);
  }
}
//Start scroll
const scrollText = (id) => {
  const element = document.getElementById(id);
  element.classList.add("scrolling-text-item");
  const textCopy = element.cloneNode(true);
  textCopy.id = element.id + "-copy";
  const scrollElement = document.createElement("div");
  scrollElement.id = "scroll-container";
  scrollElement.classList.add("scrolling-text-container");
  const innerElements = `<div class="scrolling-text-inner" role="marquee" style="--marquee-speed: 10s; --direction: scroll-left">
                            <div class="scrolling-text">
                              ${element.outerHTML}                               
                            </div>
                            <div class="scrolling-text">
                              ${textCopy.outerHTML} 
                            </div>
                          </div>`;
  scrollElement.innerHTML = innerElements;
  element.replaceWith(scrollElement);
};
//End scroll
const endScroll = (id) => {
  try {
    const element = document.getElementById(id);
    if (element) {
      element.classList.remove("scrolling-text-item");
      const parent = document.getElementById("name");
      parent.replaceChildren(element);
    }
  } catch (err) {
    console.log("error in endScroll:");
    console.log(err);
  }
};

//Scroll race name if wont fit to screen

//On window load
window.addEventListener("load", () => {
  endScroll("race-name");
  checkOverflow("race-name");
});
//On resize
const resizeObserver = new ResizeObserver(() => {
  endScroll("race-name");
  checkOverflow("race-name");
});
resizeObserver.observe(document.getElementById("race-name").parentElement);
//On fullscreen change
document.addEventListener("fullscreenchange", () => {
  endScroll("race-name");
  checkOverflow("race-name");
});

// --- FULL SCREEN ---
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
    } catch (err) {}
  }
});

// --- UPDATE VIEW ---
const updateView = (sessions) => {
  //update state data if found one, else clear
  if (sessions.find((session) => session.status === "next")) {
    Object.assign(
      nextRace,
      sessions.find((session) => session.status === "next"),
    );
  } else {
    for (let key in nextRace) {
      delete nextRace[key];
    }
  }

  //update view
  try {
    const raceName = document.getElementById("race-name");
    const warning = document.getElementById("warnings");
    if (nextRace.name) {
      //hide warning
      raceName.innerHTML = nextRace.name;
      warning.innerHTML = "";
      warning.classList.add("hidden");

      //check if needs to scroll
      endScroll("race-name");
      checkOverflow("race-name");

      const driversTable = document.getElementById("cars-table");
      //empty drivers table
      driversTable.innerHTML = "<thead><th>Car nr.</th><th>Driver</th></thead>";
      //update drivers table
      nextRace.drivers.forEach(({ name, carNum }) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${carNum}</td><td>${name}</td>`;
        driversTable.appendChild(row);
      });
    } else {
      //show no next race warning
      warning.innerHTML = ERROR_MESSAGES[ERROR_CODES.NO_NEXT_RACE];
      warning.classList.remove("hidden");
      raceName.innerHTML = "";
      //stop scroll
      endScroll("race-name");
      //empty drivers table
      const driversTable = document.getElementById("cars-table");
      driversTable.innerHTML = "<thead><th>Car nr.</th><th>Driver</th></thead>";
    }
  } catch (err) {}
};

socket.on("session:update", (sessions) => {
  updateView(sessions);
});
socket.on("state:update", (state) => {
  updateView(state.sessions);
});
