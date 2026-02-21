import { MODE } from "../../shared/constants/raceModes.mjs";
import { SOCKET_RACE, SOCKET_STATE } from "../../shared/constants/socketMessages.js"
import { STATUS } from "../../shared/constants/status.js";
const socket = io({ autoConnect: false });

// --- DOM ELEMENTS ---
const loginPanel = document.getElementById("login-panel");
const trackerPanel = document.getElementById("tracker-panel");
const loginForm = document.getElementById("login-form");
const sessionStatusMsg = document.getElementById("session-status-msg");
const globalTimer = document.getElementById("global-timer");
const lapLog = document.getElementById("lap-log");
const buttonGrid = document.getElementById("button-grid");

// --- STATE VARIABLES ---
let globalRaceState = null;
let currentSession = null;
let lastActiveSessionId = null;
let lapCount = 0;
let localAnchorTime = null;

// 1. DETECT SERVER CONNECTION
socket.on("connect", () => {
    console.log("Connected to server");

    socket.emit(SOCKET_STATE.REQUEST);
});

socket.on("disconnect", () => {
    console.log("Lost connection to server");

    if (globalRaceState && globalRaceState.timer?.running) {
        calculateTimer();
    }
});

// --- 1. LOGIN & AUTH ---
const keyInput = document.getElementById("login-key");

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const key = keyInput.value.trim();
    socket.auth = { role: "observer", key: key };
    socket.connect();
    keyInput.disabled = true;
});

socket.on("auth:ok", () => {
    loginPanel.classList.add("hidden");
    trackerPanel.classList.remove("hidden");
    socket.emit(SOCKET_STATE.REQUEST);
});

socket.on("connect_error", () => {
    const feedback = document.getElementById("login-feedback");
    feedback.innerText = "Wrong key";
    feedback.classList.remove("hidden");
    keyInput.disabled = false;
    keyInput.value = "";
});

socket.on(SOCKET_STATE.UPDATE, (state) => {
    try {
        const previousSession = currentSession;
        const timerWasRunning = globalRaceState?.timer?.running;
        const previousServerStartedAt = globalRaceState?.timer?.startedAt;
        globalRaceState = state;
        const isRunning = state.timer?.running;
        const serverStartedAt = state.timer?.startedAt;

        if (isRunning) {
            if (!timerWasRunning || !localAnchorTime || serverStartedAt !== previousServerStartedAt) {
                const elapsedAccordingToServer = state.duration - state.timeLeft;
                localAnchorTime = Date.now() - elapsedAccordingToServer;
            }
        }

        const activeSession = state.sessions.find(s =>
            [STATUS.IN_PROGRESS, STATUS.FINISHED].includes(s.status)
        );

        const nextSession = state.sessions.find(s => s.status === STATUS.NEXT);

        const sessionStarted = activeSession && activeSession.id !== lastActiveSessionId;
        const sessionEnded = !activeSession && lastActiveSessionId !== null;

        if (sessionStarted || sessionEnded) {
            if (lapLog) lapLog.innerHTML = "";
            lapCount = 0;
            if (sessionEnded) {
                localAnchorTime = null;
            }
            if (globalTimer) {
                const dur = (state && state.duration) ? state.duration : 0;
                globalTimer.innerText = sessionEnded ? formatTime(dur) : "00:00:000s";
            }
        }

        lastActiveSessionId = activeSession ? activeSession.id : null;
        currentSession = activeSession;

        if (activeSession) {
            if (sessionStatusMsg) sessionStatusMsg.classList.add("hidden");
            renderGrid();
        }
        else if (nextSession) {
            if (buttonGrid) buttonGrid.innerHTML = "";
            if (sessionStatusMsg) {
                sessionStatusMsg.innerText = `Race "${nextSession.name}" is next. Waiting for start...`;
                sessionStatusMsg.classList.remove("hidden");
            }
        }
        else {
            if (buttonGrid) buttonGrid.innerHTML = "";
            if (sessionStatusMsg) {
                sessionStatusMsg.innerText = "All sessions ended. Waiting for schedule update.";
                sessionStatusMsg.classList.remove("hidden");
            }
        }

        // --- LAP DETECTION ---
        if (currentSession && currentSession.drivers) {
            currentSession.drivers.forEach(driver => {
                const oldDriver = previousSession?.drivers?.find(d => d.carNum === driver.carNum);
                if (oldDriver && driver.lastLapAt !== oldDriver.lastLapAt) {
                    const startRef = oldDriver.lastLapAt || globalRaceState.timer.startedAt || localAnchorTime || driver.lastLapAt;
                    addLapToLog(driver.carNum, driver.lastLapAt - startRef);
                }
            });
        }

    } catch (err) {
        console.error("Error:", err);
    }
});

// --- 3. UI RENDERING ---
function renderGrid() {
    buttonGrid.innerHTML = "";
    if (!currentSession) return;

    currentSession.drivers.forEach((driver) => {
        const btn = document.createElement("button");
        btn.innerText = driver.carNum;

        const isLive = (currentSession.status === STATUS.IN_PROGRESS || currentSession.status === STATUS.FINISHED);
        const isSafe = globalRaceState.raceMode !== MODE.DANGER;

        btn.disabled = (!isLive || !isSafe);

        btn.addEventListener("click", () => {
            socket.emit(SOCKET_RACE.LAP, { sessionId: currentSession.id, carNum: driver.carNum });
            btn.style.background = "#10b981";
            setTimeout(() => btn.style.background = "", 150);
        });
        buttonGrid.appendChild(btn);
    });
}

function calculateTimer() {
    if (!localAnchorTime) return;
    let elapsed = Date.now() - localAnchorTime;
    if (elapsed >= globalRaceState.duration) elapsed = globalRaceState.duration;
    globalTimer.innerText = formatTime(elapsed);
}

function addLapToLog(carNum, lapTime) {
    lapCount++;
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.innerHTML = `<span>${lapCount}. <strong>Car #${carNum}</strong></span><span class="time">${formatTime(lapTime)}</span>`;
    lapLog.appendChild(entry);
    lapLog.scrollTop = lapLog.scrollHeight;
}

function formatTime(ms) {
    if (ms <= 0) return "00:00:000s";
    const m = Math.floor(ms / 60000).toString().padStart(2, '0');
    const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const msPart = Math.floor(ms % 1000).toString().padStart(3, '0');
    return `${m}:${s}:${msPart}s`;
}

function tick() {
    if (!socket.connected || !globalRaceState || !globalTimer) {
        requestAnimationFrame(tick);
        return;
    }

    const isFinished = currentSession?.status === STATUS.FINISHED || globalRaceState.timeLeft <= 0;

    if (isFinished) {
        globalTimer.innerText = formatTime(globalRaceState.duration);
    } else if (globalRaceState.timer?.running) {
        calculateTimer();
    }

    requestAnimationFrame(tick);
}
tick();