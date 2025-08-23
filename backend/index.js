import express from "express"
import mongoose from "mongoose";
import dotenv from "dotenv"

import authRoutes from "./routes/auth.route.js"

dotenv.config();

// console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("databse is connected");
    })
    .catch((error)=>{
        console.log(error);
    })

const app = express();

app.use(express.json())

app.listen(3000,() => {
    console.log("Server is running on port 3000!");
});

app.use("/api/auth", authRoutes)