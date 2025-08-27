import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { addTravel, getAllTravelStory } from "../controllers/travelStory.controller.js";

const router = express.Router()

router.post("/add", verifyToken, addTravel)

router.get("/get-all", verifyToken, getAllTravelStory)

export default router
