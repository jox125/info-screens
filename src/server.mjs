import express from "express";
import "dotenv/config";
import { static as serveStatic } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { STATUS, IMMUTABLE_STATUSES } from "./shared/constants/status.js";
import { ROLE } from "./shared/constants/roles.js";
import { ERROR_CODES, SUCCESS_CODES } from "./shared/constants/codes.js";
import { raceState } from "./testRaceState.js";

// Initialize express, socketIO
const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = fileURLToPath(dirname(import.meta.url));

// env keys
const RECEPTIONIST_KEY = process.env.RECEPTIONIST_KEY;
const OBSERVER_KEY = process.env.OBSERVER_KEY;
const SAFETY_KEY = process.env.SAFETY_KEY;

// Race state (currently in memory)
// const raceState = {
//     sessions: [],
//     raceMode: 'safe',   // safe, hazard, danger, finish
//     duration: 60000,    // Only 1 min races for now
// }
    
if (!RECEPTIONIST_KEY || !OBSERVER_KEY || !SAFETY_KEY) {
    console.error("ERROR: Missing required environment variables.");
    process.exit(1);
}

app.use(serveStatic("src/public"));
app.use("/shared", serveStatic("src/shared"));

app.get("/front-desk", (req, res) => {
    res.sendFile(join(__dirname, "/public/front-desk.html"));
});

// ---- AUTH get key on handshake and set role or deny connect ----
io.use((socket, next) => {
  const { role, key } = socket.handshake.auth;

  if (role === ROLE.PUBLIC) {
    socket.data.role = ROLE.PUBLIC;
    return next();
  }
  if (!key) {
    return next(new Error("Key required"));
  }
  if (role === ROLE.RECEPTIONIST && key === RECEPTIONIST_KEY) {
    socket.data.role = ROLE.RECEPTIONIST;
    return next();
  }
  if (role === ROLE.OBSERVER && key === OBSERVER_KEY) {
    socket.data.role = ROLE.OBSERVER;
    return next();
  }
  if (role === ROLE.SAFETY_OFFICIAL && key === SAFETY_KEY) {
    socket.data.role = ROLE.SAFETY_OFFICIAL;
    return next();
  }

  return next(new Error("Unauthorized"));
});

// Connect with client
io.on("connection", (socket) => {
    console.log("Client connected");
    console.log(socket.data.role);

    socket.emit("auth:ok", socket.data.role);

    // ---- SESSION MANAGEMENT ----

    // Adding a session
    socket.on("session:add", (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            console.error(socket.data.role, ERROR_CODES.FORBIDDEN);
            return socket.emit("session:error", {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const normalizedName = normalize(data.name);
        if (!normalizedName) {
            return socket.emit("session:error", {
                code: ERROR_CODES.SESSION_NAME_REQUIRED,
                focus: true,
            });
        }

        const session = {
            id: Date.now(),
            name: normalizedName,
            drivers: [],
            status: STATUS.UPCOMING, // upcoming, next, in progress, finished
        };

        raceState.sessions.push(session);
        io.emit("sessions:update", raceState.sessions);
        socket.emit("session:success", { code: SUCCESS_CODES.SESSION_ADDED });
        console.log(`[session:add] id=${session.id} name="${session.name}"`);
    });

    // Editing session name
    socket.on("session:edit", (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit("session:error", {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const session = findSession(data.sessionId);
        if (!session) {
            return socket.emit("session:error", {
                code: ERROR_CODES.SESSION_NOT_FOUND
            });
        }

        const normalizedName = normalize(data.newName);
        if (!normalizedName) {
            return socket.emit("session:edit:error", {
                sessionId: data.sessionId,
                code: ERROR_CODES.NAME_REQUIRED
            });
        }

        const status = session.status;
        if(IMMUTABLE_STATUSES.has(status)) {
            return socket.emit("session:error", {
                status,
                code: ERROR_CODES.SESSION_LOCKED
            });
        }

        const oldName = session.name;
        session.name = normalizedName;
        io.emit("sessions:update", raceState.sessions);
        socket.emit("session:success", { code: SUCCESS_CODES.SESSION_UPDATED });
        console.log(`[session:edit] id=${session.id} name="${oldName}" -> "${session.name}"`);
    });

    socket.on("session:remove", (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit("session:error", {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const session = findSession(data.sessionId);
        if (!session) {
            return socket.emit("session:error", {
                code: ERROR_CODES.SESSION_NOT_FOUND
            });
        }

        const status = session.status
        if(IMMUTABLE_STATUSES.has(status)) {
            return socket.emit("session:error", {
                status,
                code: ERROR_CODES.SESSION_LOCKED
            });
        }

        raceState.sessions = raceState.sessions.filter(
            (s) => s.id !== session.id,
        );
        io.emit("sessions:update", raceState.sessions);
        socket.emit("session:success", { code: SUCCESS_CODES.SESSION_DELETED });
        console.log(`[session:remove] id=${session.id} name="${session.name}"`);
    });

    // Adding a driver
    socket.on("driver:add", (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit("session:error", {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const normalizedName = normalize(data.name);
        if (!normalizedName) {
            return socket.emit("driver:error", {
                code: ERROR_CODES.DRIVER_NAME_REQUIRED
            });
        }

        const session = findSession(data.sessionId);
        if (!session) {
            return socket.emit("session:error", {
                code: ERROR_CODES.SESSION_NOT_FOUND
            });
        }

        const carNum = assignCar(session);
        const isFull = !carNum;
        if (isFull) {
            return socket.emit("driver:error", {
                code: ERROR_CODES.SESSION_FULL
            });
        }

        const driver = session.drivers.find(
            (d) => normalize(d.name, true) === normalize(data.name, { lowerCase: true }),
        );
        if (driver) {
            console.warn(`[driver:add] session=${session.id} driver="${driver.name}" already exists`);
            return socket.emit("driver:error", {
                name: normalize(driver.name),
                code: ERROR_CODES.DRIVER_EXISTS
            });
        }

        const newDriver = {
            id: Date.now(),
            name: normalizedName,
            carNum,
        };
        session.drivers.push(newDriver);

        io.emit("sessions:update", raceState.sessions);
        socket.emit("driver:success", { code: SUCCESS_CODES.DRIVER_ADDED });
        console.log(`[driver:add] session=${session.id} driver=${newDriver.id} name="${newDriver.name}"`);
    });

    // Editing a driver
    socket.on("driver:edit", (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit("session:error", {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const normalizedName = normalize(data.newName);
        if (!normalizedName) {
            return socket.emit("driver:edit:error", {
                sessionId: data.sessionId,
                driverId: data.driverId,
                code: ERROR_CODES.DRIVER_EXISTS
            });
        }

        const session = findSession(data.sessionId);
        if (!session) {
            return socket.emit("session:error", {
                code: ERROR_CODES.SESSION_NOT_FOUND
            });
        }

        const status = session.status;
        if(IMMUTABLE_STATUSES.has(status)) {
            return socket.emit("session:error", {
                status,
                code: ERROR_CODES.DRIVER_LOCKED
            });
        }

        const driver = findDriver(data.sessionId, data.driverId);
        if (!driver) {
            return socket.emit("driver:error", { code: ERROR_CODES.DRIVER_NOT_FOUND });
        }

        const duplicate = session.drivers.find(
            (d) => normalize(d.name, true) === normalize(data.newName, true),
        );

        // Check if a driver with the new name already exists
        if (duplicate) {
            console.warn(
                `[driver:edit] session=${session.id} driver="${duplicate.name}" already exists`,
            );
            return socket.emit("driver:edit:error", {
                driverId: data.driverId,
                name: duplicate.name,
                code: ERROR_CODES.DRIVER_EXISTS
            });
        }

        const oldName = driver.name;
        driver.name = normalizedName;
        io.emit("sessions:update", raceState.sessions);
        socket.emit("driver:success", { code: SUCCESS_CODES.DRIVER_UPDATED });
        console.log(`[driver:edit] session=${session.id} driver=${driver.id} name="${oldName}" -> "${driver.name}"`);
    });

    // Removing a driver
    socket.on("driver:remove", (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit("session:error", {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const session = findSession(data.sessionId);
        if (!session) {
            return socket.emit("session:error", {
                code: ERROR_CODES.SESSION_NOT_FOUND
            });
        }

        const status = session.status;
        if(IMMUTABLE_STATUSES.has(status)) {
            return socket.emit("session:error", {
                status,
                code: ERROR_CODES.DRIVER_LOCKED
            });
        }

        const driver = findDriver(data.sessionId, data.driverId);
        if (!driver) {
            return socket.emit("driver:error", { code: ERROR_CODES.DRIVER_NOT_FOUND });
        }

        session.drivers = session.drivers.filter((d) => d.id !== driver.id);

        io.emit("sessions:update", raceState.sessions);
        socket.emit("driver:success", { code: SUCCESS_CODES.DRIVER_DELETED });
        console.log(`[driver:remove] session=${session.id} driver=${driver.id} name="${driver.name}"`);
    });

    // ---- REQUESTS ----

    socket.on("session:request", () => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit("session:error", {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        socket.emit("sessions:update", raceState.sessions);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
});

// ---- FUNCTIONS ----

function findSession(sessionId) {
    const session = raceState.sessions.find((s) => s.id === Number(sessionId));

    if (!session) {
        console.warn(`Invalid sessionId recieved: ${sessionId}`);
        return;
    }

    return session;
}

function findDriver(sessionId, driverId) {
    const session = findSession(sessionId);
    if (!session) return;

    const driver = session.drivers.find((d) => d.id === Number(driverId));

    if (!driver) {
        console.warn(`Invalid driverId recieved: ${driverId} in session: ${sessionId}`);
        return;
    }

    return driver;
}

function assignCar(session) {
    const assigned = new Set(session.drivers.map((d) => d.carNum));
    const maxCars = 8;

    for (let num = 1; num <= maxCars; num++) {
        if (!assigned.has(num)) return num;
    }
}

function normalize(str, lowerCase = false) {
    str = str.trim();
    return lowerCase ? str.toLowerCase() : str;
}
