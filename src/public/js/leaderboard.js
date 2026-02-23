import { MODE } from "../../shared/constants/raceModes.js";
import { ROLE } from "../../shared/constants/roles.js";
import { SOCKET_STATE } from "../../shared/constants/socketMessages.js";
import { STATUS } from "../../shared/constants/status.js";

const socket = io({
  autoConnect: false,
});

socket.auth = { role: ROLE.PUBLIC };
socket.connect();

// --- 1. UI ELEMENTS & STATE ---
const timerDisplay = document.getElementById("race-timer");
const flagStatus = document.getElementById("flag-status");
const sessionName = document.getElementById("session-name");
const leaderboardBody = document.getElementById("leaderboard-body");
const fsBtn = document.getElementById("fs-btn");

let globalRaceState = null;
let localTimerInterval = null;

// --- 2. SOCKET LISTENERS ---
socket.on("connect", () => {
  console.log("Connected to Server");
  socket.emit(SOCKET_STATE.REQUEST);
});

socket.on("disconnect", () => {
  console.log("Lost connection to Server");

  if (localTimerInterval) clearInterval(localTimerInterval);

  if (
    globalRaceState &&
    globalRaceState.timer?.running &&
    globalRaceState.timer?.startedAt
  ) {
    const now = Date.now();
    const elapsed = now - globalRaceState.timer.startedAt;
    const timeLeft = Math.max(0, globalRaceState.duration - elapsed);
    timerDisplay.innerText = formatTime(timeLeft);
  }
});

socket.on(SOCKET_STATE.UPDATE, (state) => {
  globalRaceState = state;

  if (globalRaceState.timer?.running) {
    const elapsed = globalRaceState.duration - globalRaceState.timeLeft;

    const startedAt = Date.now() - elapsed;

    startLocalTimer(globalRaceState.duration, startedAt);
  } else {
    stopLocalTimer();
    timerDisplay.innerText = formatTime(globalRaceState.timeLeft);
  }

  renderLeaderboard();
});

socket.on("tic-tac", (timeLeft) => {
  if (globalRaceState) globalRaceState.timeLeft = timeLeft;

  if (!localTimerInterval && globalRaceState?.timer?.running) {
    timerDisplay.innerText = formatTime(timeLeft);
  }
});

// --- 3. TIMER ENGINE  ---

function startLocalTimer(duration, startedAt) {
  if (localTimerInterval) clearInterval(localTimerInterval);

  localTimerInterval = setInterval(() => {
    if (!socket.connected) {
      return;
    }

    const now = Date.now();
    const elapsed = now - startedAt;
    const timeLeft = Math.max(0, duration - elapsed);

    timerDisplay.innerText = formatTime(timeLeft);

    if (timeLeft <= 0) {
      stopLocalTimer();
    }
  }, 33);
}

function stopLocalTimer() {
  if (localTimerInterval) {
    clearInterval(localTimerInterval);
    localTimerInterval = null;
  }
}

// --- 4. RENDER LOGIC ---

function renderLeaderboard() {
  if (!globalRaceState) return;

  let activeSession = globalRaceState.sessions.find(
    (s) => s.status === STATUS.IN_PROGRESS || s.status === STATUS.FINISHED,
  );
  if (!activeSession) {
    const waitingStatuses = [STATUS.UPCOMING, STATUS.CONFIRMED, STATUS.NEXT];
    const completedSessions = globalRaceState.sessions.filter(
      (s) => !waitingStatuses.includes(s.status),
    );
    if (completedSessions.length > 0) {
      activeSession = completedSessions.sort((a, b) => {
        let maxA = a.id || 0;
        let maxB = b.id || 0;
        if (a.drivers && a.drivers.length > 0) {
          maxA = Math.max(
            maxA,
            ...a.drivers.map((d) => Number(d.lastLapAt) || 0),
          );
        }
        if (b.drivers && b.drivers.length > 0) {
          maxB = Math.max(
            maxB,
            ...b.drivers.map((d) => Number(d.lastLapAt) || 0),
          );
        }
        return maxB - maxA;
      })[0];
    }
  }

  if (activeSession) {
    const statusText =
      activeSession.status === STATUS.IN_PROGRESS ? "(LIVE)" : "(FINAL)";
    sessionName.textContent = `${activeSession.name} ${statusText}`;
  } else {
    sessionName.textContent = "Waiting for next session...";
    leaderboardBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No active or past race data available.</td></tr>`;
    updateFlagStatus(globalRaceState.raceMode);
    return;
  }

  updateFlagStatus(globalRaceState.raceMode);

  const sortedDrivers = [...activeSession.drivers].sort((a, b) => {
    const timeA = a.fastestLap;
    const timeB = b.fastestLap;
    if (timeA !== undefined && timeB !== undefined) return timeA - timeB;
    if (timeA !== undefined) return -1;
    if (timeB !== undefined) return 1;
    return a.carNum - b.carNum;
  });

  leaderboardBody.innerHTML = sortedDrivers
    .map((driver, index) => {
      const hasTime =
        driver.fastestLap !== undefined && driver.fastestLap !== null;
      const formattedTime = hasTime
        ? formatTime(driver.fastestLap)
        : "--:--:--";
      const laps = driver.laps || 0;
      const pos = index + 1;

      return `
            <tr class="leaderboard-row">
                <td class="pos-col">${pos}</td>
                <td class="car-col">#${driver.carNum}</td>
                <td class="driver-col">${driver.name}</td>
                <td class="laps-col">${laps}</td>
                <td class="time-col">${formattedTime}</td>
            </tr>
        `;
    })
    .join("");
}

// --- 5. HELPER FUNCTIONS ---

function updateFlagStatus(mode) {
  flagStatus.className = "flag-indicator";
  switch (mode) {
    case MODE.SAFE:
      flagStatus.classList.add("flag-safe");
      flagStatus.innerText = "SAFE";
      break;
    case MODE.HAZARD:
      flagStatus.classList.add("flag-hazard");
      flagStatus.innerText = "HAZARD";
      break;
    case MODE.DANGER:
      flagStatus.classList.add("flag-danger");
      flagStatus.innerText = "DANGER";
      break;
    case MODE.FINISHED:
      flagStatus.classList.add("flag-finished");
      flagStatus.innerText = "FINISH";
      break;
    default:
      flagStatus.classList.add("flag-danger");
      flagStatus.innerText = "STOPPED";
  }
}

function formatTime(ms) {
  if (ms < 0) ms = 0;
  const m = Math.floor(ms / 60000)
    .toString()
    .padStart(2, "0");
  const s = Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  const msPart = Math.floor(ms % 1000)
    .toString()
    .padStart(3, "0");
  return `${m}:${s}:${msPart}`;
}

// --- 6. FULL SCREEN TOGGLE ---
fsBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement
      .requestFullscreen()
      .catch((err) => console.log(err));
    fsBtn.textContent = "Exit Full Screen";
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      fsBtn.textContent = "⛶ Full Screen";
    }
  }
});
