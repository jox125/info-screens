const socket = io({
    autoConnect: false,
});

socket.auth = { role: "public" };
socket.connect();

// --- 1. UI ELEMENTS ---
const timerDisplay = document.getElementById("race-timer");
const flagStatus = document.getElementById("flag-status");
const sessionName = document.getElementById("session-name");
const leaderboardBody = document.getElementById("leaderboard-body");
const fsBtn = document.getElementById("fs-btn");

let globalRaceState = null;

// --- 2. SOCKET LISTENERS ---

socket.on("connect", () => {
    console.log("Connected to Leaderboard stream");
    socket.emit("state:request");
});

socket.on("connect_error", (err) => {
    console.error("Connection failed:", err.message);
    sessionName.textContent = "Connecting...";
});

socket.on("state:update", (state) => {
    if (globalRaceState && globalRaceState.timer?.running && state.timer?.running) {
        delete state.timeLeft;
    }

    globalRaceState = state;
    renderLeaderboard();
});

socket.on("tic-tac", (timeLeft) => {
    if (!globalRaceState) return;

    globalRaceState.timeLeft = timeLeft;

    if (globalRaceState.timer?.running || timeLeft > 0) {
        timerDisplay.innerText = formatTime(timeLeft);
    }
});

// --- 3. RENDER LOGIC ---

function renderLeaderboard() {
    if (!globalRaceState) return;

    // --- A. FIND ACTIVE SESSION ---
    let activeSession = globalRaceState.sessions.find(s => s.status === "in progress");

    // 2. If none running, look for the most recent FINISHED or CLOSED race
    if (!activeSession) {
        const pastSessions = [...globalRaceState.sessions]
            .reverse()
            .find(s => ["finished", "closed"].includes(s.status));
        activeSession = pastSessions;
    }

    // --- B. UPDATE HEADER INFO ---
    if (activeSession) {
        const statusText = activeSession.status === "in progress" ? "(LIVE)" : "(FINAL)";
        sessionName.textContent = `${activeSession.name} ${statusText}`;
    } else {
        sessionName.textContent = "Waiting for next session...";
        leaderboardBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No active or past race data available.</td></tr>`;
        updateFlagStatus("safe");
        return;
    }

    // Update Flag Color/Text
    updateFlagStatus(globalRaceState.raceMode);

    // --- C. SORT DRIVERS ---
    // 1. Fastest Lap (Ascending)
    // 2. Drivers with no time go to bottom
    // 3. Tie-breaker: Car Number
    const sortedDrivers = [...activeSession.drivers].sort((a, b) => {
        const timeA = a.fastestLap;
        const timeB = b.fastestLap;

        // Both have times -> Fastest wins
        if (timeA !== undefined && timeB !== undefined) return timeA - timeB;
        // Only A has time -> A wins
        if (timeA !== undefined) return -1;
        // Only B has time -> B wins
        if (timeB !== undefined) return 1;
        // Neither has time -> Sort by Car Number
        return a.carNum - b.carNum;
    });

    // --- D. GENERATE TABLE ROWS ---
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

// --- 4. HELPER FUNCTIONS ---

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

// --- 5. FULL SCREEN TOGGLE ---
fsBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
        fsBtn.textContent = "Exit Full Screen";
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            fsBtn.textContent = "⛶ Full Screen";
        }
    }
});