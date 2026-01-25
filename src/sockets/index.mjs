import { registerRaceActions } from "./race-actions.mjs";

export function registerSocketHandlers(io, { raceState }) {
    
  io.on("connection", (socket) => {
    console.log("Client connected");
    console.log(socket.data.role);
    socket.emit("auth:ok", socket.data.role);

    //register race actions
    registerRaceActions(socket, io, { raceState });

    // ---- SESSION MANAGEMENT ----

    // Adding a session
    socket.on("session:add", (data) => {
      const session = {
        name: data.name,
        drivers: [],
        status: "upcoming",
      };
      raceState.sessions.push(session);
      io.emit("sessions:update", raceState.sessions);

      // For debugging
      console.log(raceState);
    });

    // ---- REQUESTS ----

    socket.on("state:request", () => {
      socket.emit("state:update", raceState);
    });

    socket.on("session:request", () => {
      socket.emit("sessions:update", raceState.sessions);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
}