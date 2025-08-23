import express from "express"
import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config();

mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("databse is connected");
    })
    .catch((error)=>{
        console.log(error);
    })

const app = express();

app.get('/',(req,res)=>{
    res.send("Hello");
})

app.listen(3000,() => {
    console.log("Server is running on port 3000!");
});