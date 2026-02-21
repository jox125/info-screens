import { STATUS } from "../../shared/constants/status.js";
import {
  SOCKET_STATE,
  SOCKET_SESSION,
} from "../../shared/constants/socketMessages.js";
import { ROLE } from "../../shared/constants/roles.js";
import { MODE } from "../../shared/constants/raceModes.mjs";

const socket = io({
  autoConnect: false,
});

const nextRace = {};
let raceMode = "";
let raceInProgress = false;
const role = ROLE.PUBLIC;
const urlParams = new URLSearchParams(window.location.search);
const audioEnabled = urlParams.get("audio") === "true";
let lastAnnouncedSessionId = null;
let lastAnnouncedSessionIdForPaddock = null;

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

// --- UPDATE VIEW ---
const updateView = (sessions) => {
  //is race in progress?
  raceInProgress = sessions.find(
    (session) => session.status === STATUS.IN_PROGRESS,
  )
    ? true
    : false;
  //update state data if found one, else clear
  if (sessions.find((session) => session.status === STATUS.NEXT)) {
    Object.assign(
      nextRace,
      sessions.find((session) => session.status === STATUS.NEXT),
    );
    announceNextRace(nextRace);
  } else {
    for (let key in nextRace) {
      delete nextRace[key];
    }
  }

  //update view
  try {
    const raceName = document.getElementById("race-name");
    const announcement = document.getElementById("announcement");
    if (nextRace.name) {
      //show proceed to paddock announcement      
      if (raceMode === MODE.DANGER && !raceInProgress) {
        announcement.classList.remove("hidden");
        announcement.innerHTML =
          "<div>🚦 PROCEED TO PADDOCK 🚦</div> <div>Drivers please move to the paddock area.</div>";
        announceProceedToThePaddock(nextRace);
      } else {
        announcement.innerHTML = "";
        announcement.classList.add("hidden");
      }

      raceName.innerHTML = nextRace.name;
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
      //empty next Race data
      raceName.innerHTML = "";
      //hide announcement
      announcement.innerHTML = "";
      announcement.classList.add("hidden");
      //stop scroll
      endScroll("race-name");
      //empty drivers table
      const driversTable = document.getElementById("cars-table");
      driversTable.innerHTML = "<thead><th>Car nr.</th><th>Driver</th></thead>";
    }
  } catch (err) {}
};

socket.on(SOCKET_SESSION.UPDATE, (sessions) => {
  updateView(sessions);
});
socket.on(SOCKET_STATE.UPDATE, (state) => {
  raceMode = state.raceMode;
  updateView(state.sessions);
});

// ---- BONUS FUNCTIONALITY ---- (Automated Track Announcer)
function announceNextRace(race) {
  if (
    !audioEnabled ||
    !race ||
    !race.drivers ||
    race.id === lastAnnouncedSessionId
  )
    return;
  lastAnnouncedSessionId = race.id;
  const driverNames = race.drivers.map((d) => d.name).join(", ");
  const message = `Attention drivers. The next race, ${race.name}, is starting soon. Drivers ${driverNames}, please get ready to move to the paddock area.`;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.pitch = 1.0;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}
function announceProceedToThePaddock(race) {
  if (
    !audioEnabled ||
    !race ||
    !race.drivers ||
    race.id === lastAnnouncedSessionIdForPaddock
  )
    return;
  lastAnnouncedSessionIdForPaddock = race.id;
  const driverNames = race.drivers.map((d) => d.name).join(", ");
  const message = `Attention drivers. The next race, ${race.name}, is starting now. Drivers ${driverNames}, please proceed to the paddock area.`;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.pitch = 1.0;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}
