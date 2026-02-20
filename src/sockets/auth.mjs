import { ROLE } from "../shared/constants/roles.js";

export function socketAuth(RECEPTIONIST_KEY, OBSERVER_KEY, SAFETY_KEY) {
  // ---- AUTH get key on handshake and set role or deny connect ----
  return((socket, next) => {
    const { role, key } = socket.handshake.auth;

    if (role === ROLE.PUBLIC) {
      socket.data.role = ROLE.PUBLIC;
      return next();
    }
    if (!key) {
      return next(new Error("Key/Role required"));
    }
    if (role === ROLE.RECEPTIONIST && key === RECEPTIONIST_KEY) {
      socket.data.role = ROLE.RECEPTIONIST;
      return next();
    }
    if (role === ROLE.OBSERVER && key === OBSERVER_KEY) {
      socket.data.role = ROLE.OBSERVER;
      return next();
    }
    if (role === ROLE.SAFETY_OFFICIAL && key === SAFETY_KEY) {
      socket.data.role = ROLE.SAFETY_OFFICIAL;
      return next();
    }

    setTimeout(()=>{return next(new Error("Unauthorized"));}, 500);
    
  });
}