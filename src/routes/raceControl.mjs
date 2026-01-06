import { Router } from "express";


const router = Router();

router.get("/race-control", (request, response) => {
    return response.status(200).send({msg: "Beachside Racetrack control screen"})
});

export default router;