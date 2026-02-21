import { SOCKET_COUNTDOWN } from "../shared/constants/socketMessages.js";

export function registerCountdown(socket, io, { raceState }) {
  // Updates countdown with timeLeft if a session is running or duration if not
  socket.on(SOCKET_COUNTDOWN.REQUEST, () => {
    if (!raceState.timeLeft || raceState.timeLeft === 0) {
      return socket.emit(SOCKET_COUNTDOWN.UPDATE, raceState.duration);
    }

    return socket.emit(SOCKET_COUNTDOWN.UPDATE, raceState.timeLeft);
  });
}
