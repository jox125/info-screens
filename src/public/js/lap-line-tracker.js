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
let lastSyncTimestamp = 0;
let lapCount = 0;

// --- 1. LOGIN & AUTH ---
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const key = document.getElementById("login-key").value.trim();
    socket.auth = { role: "observer", key: key };
    socket.connect();
});

socket.on("auth:ok", () => {
    loginPanel.classList.add("hidden");
    trackerPanel.classList.remove("hidden");
    socket.emit("state:request");
});

socket.on("connect_error", () => {
    const feedback = document.getElementById("login-feedback");
    feedback.innerText = "Wrong key";
    feedback.classList.remove("hidden");
    setTimeout(() => feedback.classList.add("hidden"), 3000);
});

socket.on("state:update", (state) => {
    try {
        const previousSession = currentSession;
        globalRaceState = state;
        const timerWasRunning = previousSession?.timer?.running;
        if (state.timer?.running !== timerWasRunning || !lastSyncTimestamp) {
            lastSyncTimestamp = Date.now();
        }

        const activeSession = state.sessions.find(s =>
            ["in progress", "finished"].includes(s.status)
        );

        const nextSession = state.sessions.find(s => s.status === "next");

        const sessionStarted = activeSession && activeSession.id !== lastActiveSessionId;
        const sessionEnded = !activeSession && lastActiveSessionId !== null;

        if (sessionStarted || sessionEnded) {
            if (lapLog) lapLog.innerHTML = "";
            lapCount = 0;
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
                    const startRef = oldDriver.lastLapAt || globalRaceState.timer.startedAt;
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

        const isLive = (currentSession.status === "in progress" || currentSession.status === "finished");
        const hasTime = globalRaceState.timeLeft > 0;
        const isSafe = globalRaceState.raceMode !== "danger";

        btn.disabled = (!isLive || !hasTime || !isSafe);

        btn.addEventListener("click", () => {
            socket.emit("race:lap", { sessionId: currentSession.id, carNum: driver.carNum });
            btn.style.background = "#10b981";
            setTimeout(() => btn.style.background = "", 150);
        });
        buttonGrid.appendChild(btn);
    });
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
    if (!globalRaceState || !globalTimer) {
        requestAnimationFrame(tick);
        return;
    }

    const isFinished = currentSession?.status === "finished" || globalRaceState.timeLeft <= 0;

    if (isFinished) {
        globalTimer.innerText = formatTime(globalRaceState.duration);
    } else if (globalRaceState.timer?.running) {
        const now = Date.now();
        const serverTimeAtLastPacket = globalRaceState.duration - globalRaceState.timeLeft;
        const localTimeSincePacket = now - lastSyncTimestamp;

        let elapsed = serverTimeAtLastPacket + localTimeSincePacket;

        if (elapsed >= globalRaceState.duration) elapsed = globalRaceState.duration;

        globalTimer.innerText = formatTime(elapsed);
    }

    requestAnimationFrame(tick);
}
tick();