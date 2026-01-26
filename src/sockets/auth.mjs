export function socketAuth(RECEPTIONIST_KEY, OBSERVER_KEY, SAFETY_KEY) {
  // ---- AUTH get key on handshake and set role or deny connect ----
  return((socket, next) => {
    const { role, key } = socket.handshake.auth;

    if (role === "public") {
      socket.data.role = "public";
      return next();
    }
    if (!key) {
      return next(new Error("Key required"));
    }
    if (role === "receptionist" && key === RECEPTIONIST_KEY) {
      socket.data.role = "receptionist";
      return next();
    }
    if (role === "observer" && key === OBSERVER_KEY) {
      socket.data.role = "observer";
      return next();
    }
    if (role === "safety-official" && key === SAFETY_KEY) {
      socket.data.role = "safety-official";
      return next();
    }

    return next(new Error("Unauthorized"));
  });
}