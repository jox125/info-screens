import { SOCKET_COUNTDOWN } from "../shared/constants/socketMessages.js";

/*
    TODO:
    Update countdown timer to next race when available
*/

export function registerCountdown(socket, io, { raceState }) {
    io.on("tic-tac", (timeLeft) => {
        socket.emit(SOCKET_COUNTDOWN.UPDATE, { timeLeft });
    });

    socket.on(SOCKET_COUNTDOWN.REQUEST, () => {
        if(!raceState.timeLeft || raceState.timeLeft === 0) {
            return socket.emit(SOCKET_COUNTDOWN.UPDATE, raceState.duration);
        }
        return socket.emit(SOCKET_COUNTDOWN.UPDATE, raceState.timeLeft);
    });
}