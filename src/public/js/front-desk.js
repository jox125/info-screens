import { STATUS, IMMUTABLE_STATUSES } from "/shared/constants/status.js";

const socket = io({
    autoConnect: false
});

const body = document.body;
const sessionPanel = document.getElementById("session-panel");
const addSessionForm = document.getElementById("add-session-form");
const sessionNameInput = document.getElementById("session-name");
const sessionFeedback = document.getElementById("session-feedback");
const sessionList = document.getElementById("session-list");
const addDriverForm = document.getElementById("add-driver-form");
const driverNameInput = document.getElementById("driver-name");
const driverFeedback = document.getElementById("driver-feedback");
const driverList = document.getElementById("driver-list");
const driverPanel = document.getElementById("driver-panel");
const driverPanelClose = document.getElementById("driver-panel-close");

const currentEditForm = {
    sessionId: null,
    driverId: null
};
let sessions = [];
let selectedSessionId = null;

// Authentication
const loginPanel = document.getElementById("login-panel");
const loginForm = document.getElementById("login-form");
const loginInput = document.getElementById("login-key");
const loginFeedback = document.getElementById("login-feedback");

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const role = "receptionist";
    const key = loginInput.value.trim();
    socket.auth = { role, key };
    socket.connect();
    loginInput.value = "";
});

socket.on("connect_error", (err) => {
    console.log(err);
    loginFeedback.textContent = "Wrong key";
    loginFeedback.classList.remove("hidden");
    loginInput.disabled = true;
    loginInput.placeholder = "Disabled";
    window.setTimeout(() => {
        loginInput.disabled = false;
        loginInput.placeholder = "Please enter key";
    }, 500);
});

socket.on("auth:ok", (role) => {
    if(role !== "receptionist") return;
    document.querySelector(".interface-content").removeChild(loginPanel);
    sessionPanel.classList.remove("hidden");
});


// After auth
socket.on("connect", () => {
    console.log("Connected to server");

    // Request initial data
    socket.emit("session:request");
});

// Render sessions after updates
socket.on("sessions:update", (data) => {
    sessions = data;
    renderSessions();

    if (selectedSessionId) {
        renderDrivers();
    }

    resetSessionFeedback();
    resetDriverFeedback();

    document.querySelectorAll(".edit-session-form").forEach((form) => {
        form.classList.add("hidden");

        const errorElement = form.querySelector(".error-message");
        if (errorElement) {
            errorElement.classList.add("hidden");
            errorElement.textContent = "";
        }
    });

    document.querySelectorAll(".edit-driver-form").forEach((form) => {
        form.classList.add("hidden");

        const errorElement = form.querySelector(".error-message");
        if (errorElement) {
            errorElement.classList.add("hidden");
            errorElement.textContent = "";
        }
    });
});

socket.on("state:update", (data) => {
    syncSessionStatus(data.sessions);
    renderSessions();
});

// ---- FEEDBACK MESSAGES ----

// Successful session action messages
socket.on("session:success", (data) => {
    sessionFeedback.textContent = data.message;
    sessionFeedback.classList.add("success-message");
    sessionFeedback.classList.remove("hidden");
});

// Successful driver action messages
socket.on("driver:success", (data) => {
    driverFeedback.textContent = data.message;
    driverFeedback.classList.add("success-message");
    driverFeedback.classList.remove("hidden");
});

// General error messages (No name, session not found etc...)
socket.on("session:error", (data) => {
    resetSessionFeedback();
    resetDriverFeedback();

    sessionFeedback.textContent = data.message;
    sessionFeedback.classList.add("error-message");
    sessionFeedback.classList.remove("hidden");

    // If no name is given, focus input box
    if (data.focus) sessionFeedback.focus();
});

// Error message if something went wrong trying to edit a session
socket.on("session:edit:error", (data) => {
    resetSessionFeedback();
    resetDriverFeedback();

    const sessionItem = document.querySelector(
        `.session-item[data-session-id="${data.sessionId}"]`,
    );

    if (!sessionItem) return;

    const editForm = sessionItem.querySelector(".edit-session-form");
    const errorElement = editForm.querySelector(".error-message");
    const input = editForm.querySelector(".edit-session-name");

    errorElement.textContent = data.message;
    errorElement.classList.remove("hidden");

    editForm.classList.remove("hidden");
    input.focus();
});

// Error message if something went wrong trying to add a driver
socket.on("driver:error", (data) => {
    resetSessionFeedback();
    resetDriverFeedback();

    driverFeedback.textContent = data.message;
    driverFeedback.classList.add("error-message");
    driverFeedback.classList.remove("hidden", "success-message");
    driverNameInput.focus();
});

// Error message if something went wrong trying to edit a driver
socket.on("driver:edit:error", (data) => {
    resetSessionFeedback();
    resetDriverFeedback();

    const driverItem = document.querySelector(
        `.driver-item[data-driver-id="${data.driverId}"]`,
    );

    if (!driverItem) return;

    const editForm = driverItem.querySelector(".edit-driver-form");
    const errorElement = editForm.querySelector(".error-message");
    const input = editForm.querySelector(".edit-driver-name");

    errorElement.textContent = data.message;
    errorElement.classList.remove("hidden");

    editForm.classList.remove("hidden");
    input.value = "";
    input.focus();
});

// ---- EVENT LISTENERS ----

// Listener for creating new session
addSessionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const sessionName = sessionNameInput.value.trim();

    if (!sessionName) {
        sessionFeedback.textContent = "Session name is required";
        sessionFeedback.classList.add("error-message");
        sessionFeedback.classList.remove("hidden", "success-message");
        sessionNameInput.focus();
        return;
    }

    sessionNameInput.value = "";
    socket.emit("session:add", { name: sessionName });
});

// Listener for toggling driverPanel visibility and removing session
sessionList.addEventListener("click", (e) => {
    const session = e.target;
    const sessionItem = session.closest(".session-item");

    if (!sessionItem) return;
    if (session.closest(".edit-session-form")) return;

    // Remove session
    const isRemoveButton = session.classList.contains("remove-session-button");
    const id = Number(sessionItem.dataset.sessionId);

    if (isRemoveButton) {
        removeSession(id);

        // Hide driver panel if session was selected
        if (selectedSessionId === id) {
            selectedSessionId = null;
            driverPanel.classList.add("hidden");
            body.classList.remove("driver-panel-visible");
        }
        return;
    }

    // Toggles edit form
    if (session.classList.contains("edit-session-button")) {
        const editForm = sessionItem.querySelector(".edit-session-form");
        if(currentEditForm.sessionId === editForm.id) {
            editForm.classList.add("hidden");
            currentEditForm.sessionId = null;
            currentEditForm.driverId = null;
            return;
        }
        
        closeLastEditForm();
        editForm.classList.toggle("hidden");
        currentEditForm.sessionId = editForm.id;
        currentEditForm.driverId = null;
        return;
    }

    // Toggles driverPanel visibility based on if a session is selected or not
    selectedSessionId = selectedSessionId === id ? null : id;
    driverPanel.classList.toggle("hidden", selectedSessionId === null);
    body.classList.toggle("driver-panel-visible", selectedSessionId !== null);

    renderSessions();
    renderDrivers();
});

// Listener for editing session name
sessionList.addEventListener("submit", (e) => {
    if (!e.target.classList.contains("edit-session-form")) return;
    e.preventDefault();

    const sessionItem = e.target.closest(".session-item");
    const sessionId = sessionItem.dataset.sessionId;
    const input = sessionItem.querySelector(".edit-session-name");
    const newName = input.value.trim();
    const errorElement = e.target.querySelector(".error-message");

    if (!newName) {
        errorElement.textContent = "Name is required";
        errorElement.classList.remove("hidden");
        input.focus();
        return;
    }

    editSession(sessionId, newName);
});

// Listener for creating new driver
addDriverForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const driverName = driverNameInput.value.trim();

    if (!driverName) {
        driverFeedback.textContent = "Driver name is required";
        driverFeedback.classList.add("error-message");
        driverFeedback.classList.remove("hidden", "success-message");
        driverNameInput.focus();
        return;
    }
    driverNameInput.value = "";

    socket.emit("driver:add", {
        sessionId: selectedSessionId,
        name: driverName,
    });
});

// Listener for toggling edit form and removing driver
driverList.addEventListener("click", (e) => {
    const driver = e.target;
    const driverItem = driver.closest(".driver-item");

    // Remove driver
    if (driver.classList.contains("remove-driver-button")) {
        const driverId = driverItem.dataset.driverId;
        removeDriver(driverId);
    }

    // Toggles edit form
    if (driver.classList.contains("edit-driver-button")) {
        const editForm = driverItem.querySelector(".edit-driver-form");
        if(currentEditForm.driverId === editForm.id) {
            editForm.classList.add("hidden");
            currentEditForm.sessionId = null;
            currentEditForm.driverId = null;
            return;
        }
        
        closeLastEditForm();
        editForm.classList.toggle("hidden");
        currentEditForm.sessionId = null;
        currentEditForm.driverId = editForm.id;
    }
});

// Listener for editing driver
driverList.addEventListener("submit", (e) => {
    if (!e.target.classList.contains("edit-driver-form")) return;
    e.preventDefault();

    const driverItem = e.target.closest(".driver-item");
    const driverId = driverItem.dataset.driverId;
    const input = driverItem.querySelector(".edit-driver-name");
    const newName = input.value.trim();
    const errorElement = e.target.querySelector(".error-message");

    if (!newName) {
        errorElement.textContent = "Name is required";
        errorElement.classList.remove("hidden");
        input.focus();
        return;
    }

    editDriver(driverId, newName);
});

driverPanelClose.addEventListener("click", () => {
    driverPanel.classList.add("hidden");
    body.classList.remove("driver-panel-visible");
    selectedSessionId = null;
    renderSessions();
});

// ---- FUNCTIONS ----

// Renders the session list
function renderSessions() {
    sessionList.innerHTML = "";
    sessionFeedback.textContent = "";
    sessionFeedback.classList.add("hidden");
    currentEditForm.sessionId = null;
    currentEditForm.driverId = null;

    if (sessions.length === 0) {
        const emptyMessage = createEmptyMessage(
            "No sessions yet. Add one to get started.",
        );
        emptyMessage.classList.add("empty-message--sessions");

        sessionList.appendChild(emptyMessage);
        driverPanel.classList.add("hidden");
        body.classList.remove("driver-panel-visible");
        return;
    }

    const statusOrder = [STATUS.IN_PROGRESS, STATUS.NEXT, STATUS.UPCOMING, STATUS.FINISHED];
    const groupedSessions = {
        [STATUS.IN_PROGRESS]: [],
        [STATUS.NEXT]: [],
        [STATUS.UPCOMING]: [],
        [STATUS.FINISHED]: [],
    };

    // Group sessions by status
    sessions.forEach((session) => {
        if (groupedSessions[session.status]) {
            groupedSessions[session.status].push(session);
        }
    });

    // Render groups with a status header
    statusOrder.forEach((status) => {
        const sessionsInGroup = groupedSessions[status];
        let mutable = null;

        if(IMMUTABLE_STATUSES.has(status)) {
            mutable = false;
        } else {
            mutable = true;
        }

        const column = document.createElement("div");
        column.classList.add("session-column");

        const header = document.createElement("h2");
        header.classList.add("session-status-header");
        header.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        column.appendChild(header);

        if (sessionsInGroup.length === 0) {
            const emptyMessage = createEmptyMessage(`No ${status} sessions`);
            column.appendChild(emptyMessage);
        } else {
            sessionsInGroup.forEach((session) => {
                const item = createSessionItem(session, mutable);
                column.appendChild(item);
            });
        }

        sessionList.appendChild(column);
    });
}

// Render drivers for selected session
function renderDrivers() {
    driverList.innerHTML = "";
    driverFeedback.textContent = "";
    driverFeedback.classList.add("hidden");
    currentEditForm.sessionId = null;
    currentEditForm.driverId = null;

    const session = sessions.find((s) => s.id === selectedSessionId);

    if (!session || session.drivers.length === 0) {
        const emptyMessage = createEmptyMessage(
            "No drivers yet. Add one to get started.",
        );
        emptyMessage.classList.add("empty-message--drivers");
        driverList.appendChild(emptyMessage);
        return;
    }

    const sortedDrivers = [...session.drivers].sort(
        (a, b) => a.carNum - b.carNum,
    );

    sortedDrivers.forEach((driver) => {
        const status = session.status;
        let mutable = null;

        if(IMMUTABLE_STATUSES.has(status)) {
            mutable = false;
        } else {
            mutable = true;
        }

        const item = createDriverItem(driver, mutable);
        driverList.appendChild(item);
    });
}

function editSession(sessionId, newName) {
    socket.emit("session:edit", {
        sessionId,
        newName,
    });
}

function removeSession(sessionId) {
    socket.emit("session:remove", {
        sessionId,
    });
}

function editDriver(driverId, newName) {
    socket.emit("driver:edit", {
        sessionId: selectedSessionId,
        driverId,
        newName,
    });
}

function removeDriver(driverId) {
    socket.emit("driver:remove", {
        sessionId: selectedSessionId,
        driverId,
    });
}

function createEmptyMessage(message) {
    const emptyMessage = document.createElement("p");
    emptyMessage.classList.add("empty-message");
    emptyMessage.textContent = message;

    return emptyMessage;
}

function createSessionItem(session, mutable) {
    const item = document.createElement("div");
    item.classList.add("session-item");
    item.classList.add("list-container");
    item.dataset.sessionId = session.id;

    if (session.id === selectedSessionId) {
        item.classList.add("selected");
    }

    const header = document.createElement("div");
    header.classList.add("session-header");

    const name = document.createElement("h3");
    name.textContent = `${session.name}`;

    const driverCount = document.createElement("span");
    driverCount.className = "driver-count";
    driverCount.textContent = `${session.drivers.length} drivers`;
    
    header.appendChild(name);
    header.appendChild(driverCount);
    item.appendChild(header);

    // If mutable, add buttons for editing, removing
    if(mutable) {
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        const editButton = document.createElement("button");
        editButton.classList.add("edit-session-button");
        editButton.textContent = "Edit Session";

        const editForm = document.createElement("form");
        editForm.classList.add("edit-session-form", "hidden");
        editForm.id = session.id;

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.classList.add("edit-session-name");
        nameInput.id = `session-${session.id}`;
        nameInput.placeholder = "New session name";

        const editError = document.createElement("p");
        editError.classList.add("error-message", "hidden");

        const saveButton = document.createElement("button");
        saveButton.type = "submit";
        saveButton.textContent = "Save session";

        const removeButton = document.createElement("button");
        removeButton.classList.add("remove-session-button");
        removeButton.textContent = "Remove Session";

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(removeButton);
        editForm.appendChild(nameInput);
        editForm.appendChild(editError);
        editForm.appendChild(saveButton);
        item.appendChild(buttonContainer);
        item.appendChild(editForm);
    }

    return item;
}

function createDriverItem(driver, mutable) {
    const item = document.createElement("div");
    item.classList.add("driver-item", "list-container");
    item.dataset.driverId = driver.id;

    const header = document.createElement("div");
    header.classList.add("driver-header");

    const driverName = document.createElement("h3");
    driverName.textContent = driver.name;

    const driverCar = document.createElement("span");
    driverCar.classList.add("driver-car");
    driverCar.textContent = `#${driver.carNum}`;

    header.appendChild(driverName);
    header.appendChild(driverCar);
    item.appendChild(header);

    if(mutable) {
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        const editButton = document.createElement("button");
        editButton.classList.add("edit-driver-button");
        editButton.textContent = "Edit Driver";

        const editForm = document.createElement("form");
        editForm.classList.add("edit-driver-form", "hidden");
        editForm.id = driver.id;

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.classList.add("edit-driver-name");
        nameInput.id = `driver-${driver.id}`;
        nameInput.placeholder = "New driver name";

        const editError = document.createElement("p");
        editError.classList.add("error-message", "hidden");

        const saveButton = document.createElement("button");
        saveButton.type = "submit";
        saveButton.textContent = "Save driver";

        const removeButton = document.createElement("button");
        removeButton.classList.add("remove-driver-button");
        removeButton.textContent = "Remove Driver";

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(removeButton);
        editForm.appendChild(nameInput);
        editForm.appendChild(editError);
        editForm.appendChild(saveButton);
        item.appendChild(buttonContainer);
        item.appendChild(editForm);
    }

    return item;
}

function syncSessionStatus(serverSessions) {
    serverSessions.forEach(serverSession => {
        const localSession = sessions.find(s => s.id === serverSession.id);

        if(!localSession) return;

        if(localSession.status !== serverSession.status) {
            localSession.status = serverSession.status;
        }
    });
}

function resetSessionFeedback() {
    sessionFeedback.classList.add("hidden");
    sessionFeedback.classList.remove("success-message", "error-message");
    sessionFeedback.textContent = "";
}

function resetDriverFeedback() {
    driverFeedback.classList.add("hidden");
    driverFeedback.classList.remove("success-message", "error-message");
    driverFeedback.textContent = "";
}

function closeLastEditForm() {
    const sessionColumns = document.querySelectorAll(".session-column");

    sessionColumns.forEach((elem) => {
        const status = elem
            .querySelector(".session-status-header")
            .textContent
            .trim()
            .toLowerCase();

        if(IMMUTABLE_STATUSES.has(status)) return;

        const sessionItems = elem.querySelectorAll(".session-item");
        if(!sessionItems) return;
        sessionItems.forEach(item => {
            const editForm = item.querySelector(".edit-session-form");
            editForm.classList.add("hidden");
        });
        
        const driverItems = driverList.querySelectorAll(".driver-item");
        if(!driverItems) return;
        driverItems.forEach(item => {
            const editForm = item.querySelector(".edit-driver-form");
            editForm.classList.add("hidden");
        });
    });
}

/* TODO
Front Desk/Receptionist

Move some things to constants
Clean up code
*/
