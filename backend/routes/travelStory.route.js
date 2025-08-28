import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { addTravel, getAllTravelStory, imageUpload } from "../controllers/travelStory.controller.js";
import upload from "../multer.js";

const router = express.Router()

router.post("/image-upload", upload.single("image"), imageUpload)

router.post("/add", verifyToken, addTravel)

router.get("/get-all", verifyToken, getAllTravelStory)

export default router
