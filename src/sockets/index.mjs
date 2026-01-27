import { registerRaceActions } from "./race-actions.mjs";
import { registerReceptionist } from "./receptionist.js";
import { ROLE } from "../shared/constants/roles.js";
import { SOCKET_SESSION } from "../shared/constants/socketMessages.js";
import { ERROR_CODES } from "../shared/constants/codes.js";

export function registerSocketHandlers(io, { raceState }) {
    
  io.on("connection", (socket) => {
    console.log("Client connected");
    console.log(socket.data.role);
    socket.emit("auth:ok", socket.data.role);

    //register race actions
    registerRaceActions(socket, io, { raceState });

    // Register receptionist
    registerReceptionist(socket, io, { raceState });


    // ---- REQUESTS ----

    socket.on("state:request", () => {
      socket.emit("state:update", raceState);
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