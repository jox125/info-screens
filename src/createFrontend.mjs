import express from "express";
import router from "./views/raceControl.mjs";

export function createFrontend(){

    const app = express();
    app.use(router);
    
   return app;
}