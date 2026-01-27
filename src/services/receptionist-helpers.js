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

export function assignCar(session) {
    const carNumbers = [ 11, 22, 33, 44, 55, 66, 77, 88];
    const assigned = new Set(session.drivers.map((d) => d.carNum));
    
    return carNumbers.find(num => !assigned.has(num)) ?? null;
}