import express from "express"
import mongoose from "mongoose";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js"
import userRoutes from "./routes/user.route.js"

dotenv.config();

// console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("database is connected");
    })
    .catch((error)=>{
        console.log(error);
    })

const app = express();

app.use(cookieParser());

// for allow json object in request body
app.use(express.json())

app.listen(3000,() => {
    console.log("Server is running on port 3000!");
});

app.use("/api/auth", authRoutes)

app.use("/api/user", userRoutes)

app.use((err, req, res, next)=>{
    const statusCode = err.statusCode || 500
    
    const message = err.message || "Internal Server Error"

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    })
})
