import { ERROR_CODES } from "../shared/constants/codes.js";

export function findSession(sessionId, { raceState }) {
    const session = raceState.sessions.find((s) => s.id === Number(sessionId));

    if (!session) {
        console.warn(`Invalid sessionId recieved: ${sessionId}`);
        return;
    }

    return session;
}

export function findDriver(sessionId, driverId, { raceState }) {
    const session = findSession(sessionId, { raceState });
    if (!session) return;

    const driver = session.drivers.find((d) => d.id === Number(driverId));

    if (!driver) {
        console.warn(`Invalid driverId recieved: ${driverId} in session: ${sessionId}`);
        return;
    }

    return driver;
}

export function assignCar(session, carNum = null) {
    const assigned = new Set(session.drivers.map((d) => d.carNum));
    if(assigned.size >= 8) return ERROR_CODES.SESSION_FULL;

    // If carNum is provided use it
    if(carNum !== null) {
        if(carNum < 0 || carNum > 999) return ERROR_CODES.CAR_OUT_OF_RANGE;
        return assigned.has(carNum) ? ERROR_CODES.CAR_EXISTS : carNum;
    }

    // Otherwise get first available number from here
    const carNumbers = [ 11, 22, 33, 44, 55, 66, 77, 88 ];
    return carNumbers.find(num => !assigned.has(num)) ?? ERROR_CODES.CAR_EXISTS;
}