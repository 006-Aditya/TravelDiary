import express from "express"
import { verifyToken } from "../utils/verifyUser.js";
import { getUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/getusers", verifyToken, getUsers);

export default router