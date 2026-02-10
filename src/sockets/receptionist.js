import { findSession, findDriver, assignCar } from "../services/receptionist-helpers.js";
import { normalize } from "../services/general-helpers.js";
import { STATUS, IMMUTABLE_STATUSES } from "../shared/constants/status.js";
import { ERROR_CODES, SUCCESS_CODES } from "../shared/constants/codes.js";
import { ROLE } from "../shared/constants/roles.js";
import { SOCKET_DRIVER, SOCKET_SESSION } from "../shared/constants/socketMessages.js";
import { ensureNextRace } from "../services/race-state.mjs"


// ---- SESSION MANAGEMENT ----
export function registerReceptionist(socket, io, { raceState }) {
    // Adding a session
    socket.on(SOCKET_SESSION.ADD, (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const normalizedName = normalize(data.name);
        if (!normalizedName) {
            return socket.emit(SOCKET_SESSION.ERROR, {
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
        //ensure next race
        ensureNextRace(raceState);
        io.emit(SOCKET_SESSION.UPDATE, raceState.sessions);
        socket.emit(SOCKET_SESSION.SUCCESS, { code: SUCCESS_CODES.SESSION_ADDED });
        console.log(`[session:add] id=${session.id} name="${session.name}"`);
    });

    // Editing session name
    socket.on(SOCKET_SESSION.EDIT, (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const session = findSession(data.sessionId, { raceState });
        if (!session) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.SESSION_NOT_FOUND
            });
        }

        const normalizedName = normalize(data.newName);
        if (!normalizedName) {
            return socket.emit(SOCKET_SESSION.EDIT_ERROR, {
                sessionId: data.sessionId,
                code: ERROR_CODES.NAME_REQUIRED
            });
        }

        const status = session.status;
        if(IMMUTABLE_STATUSES.has(status)) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                status,
                code: ERROR_CODES.SESSION_LOCKED
            });
        }

        const oldName = session.name;
        session.name = normalizedName;
        io.emit(SOCKET_SESSION.UPDATE, raceState.sessions);
        socket.emit(SOCKET_SESSION.SUCCESS, { code: SUCCESS_CODES.SESSION_UPDATED });
        console.log(`[session:edit] id=${session.id} name="${oldName}" -> "${session.name}"`);
    });

    socket.on(SOCKET_SESSION.DELETE, (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const session = findSession(data.sessionId, { raceState });
        if (!session) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.SESSION_NOT_FOUND
            });
        }

        const status = session.status
        if(IMMUTABLE_STATUSES.has(status)) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                status,
                code: ERROR_CODES.SESSION_LOCKED
            });
        }

        raceState.sessions = raceState.sessions.filter(
            (s) => s.id !== session.id,
        );
        ensureNextRace(raceState);
        io.emit(SOCKET_SESSION.UPDATE, raceState.sessions);
        socket.emit(SOCKET_SESSION.SUCCESS, { code: SUCCESS_CODES.SESSION_DELETED });
        console.log(`[session:remove] id=${session.id} name="${session.name}"`);
    });

    // Adding a driver
    socket.on(SOCKET_DRIVER.ADD, (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const normalizedName = normalize(data.name);
        if (!normalizedName) {
            return socket.emit(SOCKET_DRIVER.ERROR, {
                code: ERROR_CODES.DRIVER_NAME_REQUIRED
            });
        }

        const session = findSession(data.sessionId, { raceState });
        if (!session) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.SESSION_NOT_FOUND
            });
        }

        if(session.status === STATUS.IN_PROGRESS || session.status === STATUS.FINISHED) {
            return socket.emit(SOCKET_DRIVER.ERROR, {
                status: session.status,
                code: ERROR_CODES.SESSION_LOCKED
            });
        }

        const carNum = Number(data.carNum);
        const result = assignCar(session, carNum);

        switch(result) {
            case ERROR_CODES.SESSION_FULL:
                return socket.emit(SOCKET_DRIVER.ERROR, {
                    code: ERROR_CODES.SESSION_FULL
                });
            case ERROR_CODES.CAR_OUT_OF_RANGE:
                return socket.emit(SOCKET_DRIVER.ERROR, {
                    code: ERROR_CODES.CAR_OUT_OF_RANGE
                });
            case ERROR_CODES.CAR_EXISTS:
                return socket.emit(SOCKET_DRIVER.ERROR, {
                    code: ERROR_CODES.CAR_EXISTS,
                    carExists: true,
                    carNum: data.carNum
                });
        }

        const driver = session.drivers.find(
            (d) => normalize(d.name, true) === normalize(data.name, { lowerCase: true }),
        );
        if (driver) {
            return socket.emit(SOCKET_DRIVER.ERROR, {
                name: normalize(driver.name),
                code: ERROR_CODES.DRIVER_EXISTS
            });
        }

        const newDriver = {
            id: Date.now(),
            name: normalizedName,
            carNum: result,
        };
        session.drivers.push(newDriver);

        io.emit(SOCKET_SESSION.UPDATE, raceState.sessions);
        socket.emit(SOCKET_DRIVER.SUCCESS, { code: SUCCESS_CODES.DRIVER_ADDED });
        console.log(`[driver:add] session=${session.id} driver=${newDriver.id} name="${newDriver.name}"`);
    });

    // Editing a driver
    socket.on(SOCKET_DRIVER.EDIT, (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const normalizedName = normalize(data.newName);
        if (!normalizedName) {
            return socket.emit(SOCKET_DRIVER.EDIT_ERROR, {
                sessionId: data.sessionId,
                driverId: data.driverId,
                code: ERROR_CODES.DRIVER_NAME_REQUIRED
            });
        }

        const session = findSession(data.sessionId, { raceState });
        if (!session) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.SESSION_NOT_FOUND
            });
        }

        const status = session.status;
        if(IMMUTABLE_STATUSES.has(status)) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                status,
                code: ERROR_CODES.DRIVER_LOCKED
            });
        }

        const driver = findDriver(data.sessionId, data.driverId, { raceState });
        if (!driver) {
            return socket.emit(SOCKET_DRIVER.ERROR, {
                code: ERROR_CODES.DRIVER_NOT_FOUND
            });
        }

        const duplicateName = session.drivers.find(
            d => normalize(d.name, true) === normalize(data.newName, true),
        );

        // Check if a driver with the new name already exists
        if (duplicateName) {
            return socket.emit(SOCKET_DRIVER.EDIT_ERROR, {
                driverId: data.driverId,
                name: duplicateName.name,
                code: ERROR_CODES.DRIVER_EXISTS
            });
        }

        // Check if carNum is provided and usable
        const oldCarNum = driver.carNum;
        if(data.newCarNum !== null && data.newCarNum !== undefined && data.newCarNum !== "") {
            const carNum = Number(data.newCarNum);
            
            if(isNaN(carNum) || carNum < 0 || carNum > 999) {
                return socket.emit(SOCKET_DRIVER.EDIT_ERROR, {
                    sessionId: data.sessionId,
                    driverId: data.driverId,
                    code: ERROR_CODES.CAR_OUT_OF_RANGE
                });
            }

            const duplicateCar = session.drivers.find(
                d => d.carNum === carNum
            );
            
            // Check for duplicate car number
            if(duplicateCar) {
                return socket.emit(SOCKET_DRIVER.EDIT_ERROR, {
                    driverId: data.driverId,
                    carNum,
                    code: ERROR_CODES.CAR_EXISTS
                });
            }

            driver.carNum = carNum;
        }

        const carNumChange = oldCarNum !== driver.carNum ? `carNum="${oldCarNum}" -> "${data.newCarNum}"` : "";
        const oldName = driver.name;
        driver.name = normalizedName;
        io.emit(SOCKET_SESSION.UPDATE, raceState.sessions);
        socket.emit(SOCKET_DRIVER.SUCCESS, { code: SUCCESS_CODES.DRIVER_UPDATED });
        console.log(`[driver:edit] session=${session.id} driver=${driver.id} name="${oldName}" -> "${driver.name}" ${carNumChange}`);
    });

    // Removing a driver
    socket.on(SOCKET_DRIVER.DELETE, (data) => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        const session = findSession(data.sessionId, { raceState });
        if (!session) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.SESSION_NOT_FOUND
            });
        }

        const status = session.status;
        if(IMMUTABLE_STATUSES.has(status)) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                status,
                code: ERROR_CODES.DRIVER_LOCKED
            });
        }

        const driver = findDriver(data.sessionId, data.driverId, { raceState });
        if (!driver) {
            return socket.emit(SOCKET_DRIVER.ERROR, { code: ERROR_CODES.DRIVER_NOT_FOUND });
        }

        session.drivers = session.drivers.filter((d) => d.id !== driver.id);

        io.emit(SOCKET_SESSION.UPDATE, raceState.sessions);
        socket.emit(SOCKET_DRIVER.SUCCESS, { code: SUCCESS_CODES.DRIVER_DELETED });
        console.log(`[driver:remove] session=${session.id} driver=${driver.id} name="${driver.name}"`);
    });
}