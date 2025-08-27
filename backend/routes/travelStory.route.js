import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { addTravel } from "../controllers/travelStory.controller.js";

const router = express.Router()

router.post("/add", verifyToken, addTravel)

export default router
