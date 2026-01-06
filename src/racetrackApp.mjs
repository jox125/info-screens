import { createBackend } from "./createBackend.mjs";
import { createFrontend } from "./createFrontend.mjs";

const backend = createBackend();
const frontend = createFrontend();

const BACKEND_PORT = process.env.BACKEND_PORT || 3000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 8080;

backend.listen(BACKEND_PORT, () => {
  console.log(`Backend running on port ${BACKEND_PORT}`);
});

frontend.listen(FRONTEND_PORT, () => {
  console.log(`Frontend running on port ${FRONTEND_PORT}`);
});

