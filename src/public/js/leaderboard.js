const socket = io({
    autoConnect: false,
});

socket.auth = { role: "public" };
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
    console.log("Connected to Leaderboard");
    socket.emit("state:request");
});

socket.on("state:update", (state) => {
    globalRaceState = state;

    if (globalRaceState.timer?.running && globalRaceState.timer?.startedAt) {
        startLocalTimer(globalRaceState.duration, globalRaceState.timer.startedAt);
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

    let activeSession = globalRaceState.sessions.find(s => s.status === "in progress");
    if (!activeSession) {
        activeSession = [...globalRaceState.sessions]
            .reverse()
            .find(s => ["finished", "closed"].includes(s.status));
    }

    if (activeSession) {
        const statusText = activeSession.status === "in progress" ? "(LIVE)" : "(FINAL)";
        sessionName.textContent = `${activeSession.name} ${statusText}`;
    } else {
        sessionName.textContent = "Waiting for next session...";
        leaderboardBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No active or past race data available.</td></tr>`;
        updateFlagStatus("safe");
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

    leaderboardBody.innerHTML = sortedDrivers.map((driver, index) => {
        const hasTime = driver.fastestLap !== undefined && driver.fastestLap !== null;
        const formattedTime = hasTime ? formatTime(driver.fastestLap) : "--:--:--";
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
    }).join("");
}

// --- 5. HELPER FUNCTIONS ---

function updateFlagStatus(mode) {
    flagStatus.className = "flag-indicator";
    switch (mode) {
        case "safe":
            flagStatus.classList.add("flag-safe");
            flagStatus.innerText = "SAFE";
            break;
        case "hazard":
            flagStatus.classList.add("flag-hazard");
            flagStatus.innerText = "HAZARD";
            break;
        case "danger":
            flagStatus.classList.add("flag-danger");
            flagStatus.innerText = "DANGER";
            break;
        case "finished":
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
    const m = Math.floor(ms / 60000).toString().padStart(2, '0');
    const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const msPart = Math.floor(ms % 1000).toString().padStart(3, '0');
    return `${m}:${s}:${msPart}`;
}

// --- 6. FULL SCREEN TOGGLE ---
fsBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
        fsBtn.textContent = "Exit Full Screen";
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            fsBtn.textContent = "⛶ Full Screen";
        }
    }
});