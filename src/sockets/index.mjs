import { registerRaceActions } from "./race-actions.mjs";
import { registerReceptionist } from "./receptionist.js";
import { ROLE } from "../shared/constants/roles.js";
import { SOCKET_SESSION, SOCKET_STATE } from "../shared/constants/socketMessages.js";
import { ERROR_CODES } from "../shared/constants/codes.js";
import { registerCountdown } from "./countdown.js";

export function registerSocketHandlers(io, { raceState }) {
    
  io.on("connection", (socket) => {
    console.log("Client connected");
    console.log(socket.data.role);
    socket.emit("auth:ok", socket.data.role);

    //register race actions
    registerRaceActions(socket, io, { raceState });

    // Register receptionist
    registerReceptionist(socket, io, { raceState });

    // Register race countdown
    registerCountdown(socket, io, { raceState });


    // ---- REQUESTS ----

    socket.on(SOCKET_STATE.REQUEST, () => {
      socket.emit(SOCKET_STATE.UPDATE, raceState);
    });

    socket.on(SOCKET_SESSION.REQUEST, () => {
        if(socket.data.role !== ROLE.RECEPTIONIST) {
            return socket.emit(SOCKET_SESSION.ERROR, {
                code: ERROR_CODES.FORBIDDEN
            });
        }

        socket.emit(SOCKET_SESSION.UPDATE, raceState.sessions);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
}