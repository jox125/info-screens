import { Router } from "express";


const router = Router();

router.get("/race-control", (request, response) => {
    return response.status(200).send("Beachside Racetrack control screen");
});

export default router;