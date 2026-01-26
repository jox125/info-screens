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

// TODO: assign 11, 22 ... 88
export function assignCar(session) {
    const assigned = new Set(session.drivers.map((d) => d.carNum));
    const maxCars = 8;

    for (let num = 1; num <= maxCars; num++) {
        if (!assigned.has(num)) return num;
    }
}