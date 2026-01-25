export function ensureNextRace(raceState) {

    //add next race if no next race, and upcomings exist
    if (!raceState.sessions.find((session) => session.status === "next")) {
    if (raceState.sessions.find((session) => session.status === "upcoming")) {
        const upcomingSessions = raceState.sessions.filter(
        (session) => session.status === "upcoming"
        );
        let nextSession = {};
        //find session with smallest id
        if (!upcomingSessions) {
        } else {
        nextSession.id = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < upcomingSessions.length; i++) {
            if (upcomingSessions[i].id < nextSession.id) {
            nextSession = upcomingSessions[i];
            }
        }
        }
        raceState.sessions[raceState.sessions.indexOf(nextSession)].status = "next";
        console.log("Updating next race:");
        console.log("Race state data:");
        console.log(raceState);
    }
    }
}