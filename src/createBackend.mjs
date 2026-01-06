import express from "express";
import router from "./routes/raceControl.mjs";

export function createBackend(){

    const app = express();
    app.use(router);
    
   return app;
}