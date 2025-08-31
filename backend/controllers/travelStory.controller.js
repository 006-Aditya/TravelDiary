import { fileURLToPath } from "url";
import TravelStory from "../models/travelStory.model.js";
import {errorHandler} from "../utils/error.js";
import path from "path";
import fs from "fs";
import TravelStory from "../models/travelStory.model.js";
import imagekit from "../configs/imageKit.js";

export const addTravel = async(req, res, next) => {
    const {title, story, visitedLocation, visitedDate} = req.body 

    const userId = req.user.id

    // validate required field 
    if(!title || !story || !visitedLocation || !visitedDate){
        return next(errorHandler(400, "All fields are required"))
    }
    // convert visited date from miliseconds to date object
    const parsedVisitedDate = new Date(parseInt(visitedDate))
    try {
        let imageUrl, optimizedImageUrl, fileId;

        if (req.file) {
        // Step 1: Upload to ImageKit
        const response = await imagekit.upload({
            file: req.file.buffer, // if using memoryStorage
            fileName: req.file.originalname,
            folder: "/travelImage"
        });

        // Step 2: Generate optimized URL
        optimizedImageUrl = imagekit.url({
            path: response.filePath,
            transformation: [
            { width: 1280 },
            { quality: "auto" },
            { format: "webp" }
            ]
        });

        // Step 3: Assign values
        imageUrl = response.url;
        fileId = response.fileId;
        } else {
            // fallback if no image uploaded
            imageUrl = `http://localhost:3000/assets/placeholderImage.png`;
        }

        // Step 4: Save in DB
        const travelStory = new TravelStory({
            title,
            story,
            visitedLocation,
            userId,
            visitedDate: parsedVisitedDate,
            imageUrl,
            optimizedImageUrl,
            fileId
        });

        await travelStory.save();

        res.status(201).json({
            story: travelStory,
            message: "Your story is added successfully"
        });
    } catch (error) {
        next(error);
    }
}

export const getAllTravelStory = async(req, res, next) => {

    const userId = req.user.id

    try{
        const travelStories = await TravelStory.find({userId}).sort({
            isFavourite: -1,
        })

        res.status(200).json({
            stories: travelStories
        })
    }catch(error){
        next(error);
    }
}

export const imageUpload = async(req, res, next) => {
    const userId = req.user.id
    try{
        if(!req.file){
            return next(errorHandler(400, "No image uploaded"))
        }
        // upload image to imageKit
        const imageFile = req.file
        const fileBuffer = fs.readFileSync(imageFile.path)
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: `/travelImage/${userId}`
        })

        // For URL Generation, works for both images and videos
        const optimizedImageURL = imagekit.url({
            path : response.filePath,
            transformation : [
                {width: 1280}, // width resizing
                {quality: 'auto'}, // auto compression
                {format: 'webp'} // convert to modern format
            ]
        });

        // Save both fileId and URLs
        await TravelStory.create({
            ...req.body,
            userId,
            imageUrl: response.url,          // original ImageKit URL
            optimizedImageUrl: optimizedImageURL, // transformed URL
            fileId: response.fileId          // 🔑 needed for deletion/edit
        });
        // const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;

        res.status(201).json({optimizedImageURL})
        
    }catch(error){
        next(error);
    }
}

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

// const rootDir = path.join(__dirname, "..", )

export const deleteImage = async(req, res, next) => {
    const {fileId} = req.query

    if(!fileId){
        return next(errorHandler(400, "imageUrl parameter is required!"))
    }
    try{
        await imagekit.deleteFile(fileId);

        res.status(200).json({ message: "Image deleted successfully" });

    }catch(error){
        next(error);
    }
}

export const editTravelStory = async(req,res,next) => {
    const {id} = req.params
    const {title, story, visitedLocation, imageUrl, visitedDate} = req.body
    const userId = req.user.id

    // validate required field 
    if(!title || !story || !visitedLocation || !imageUrl || !visitedDate){
        return next(errorHandler(400, "All fields are required"))
    }
    // convert visited date from miliseconds to date object
    const parsedVisitedDate = new Date(parseInt(visitedDate))
    try{
        const travelStory = await TravelStory.findOne({
            _id: id,
            userId: userId,
        })
        if(!travelStory){
            next(errorHandler(404, "Travel Story not found!"))
        }
        const placeholderImageUrl = `http://localhost:3000/assets/placeholderImage.png`;
        travelStory.title = title;
        travelStory.story = story;
        travelStory.visitedLocation=visitedLocation;
        // travelStory.imageUrl=imageUrl || placeholderImageUrl;
        travelStory.visitedDate=parsedVisitedDate;

        // Handle image update
        if (imageUrl && fileId) {
        // If there was an old image, delete it
        if (travelStory.fileId) {
            await imagekit.deleteFile(travelStory.fileId);
        }

        // Save new image info
        travelStory.imageUrl = imageUrl;
        travelStory.fileId = fileId;
        }

        await travelStory.save()

        res.status(200).json({
            story: travelStory,
            Message: "Travel Story updated successfully",
        })
    }catch(error){
        next(error);
    }

}

export const deleteTravelStory = async(req,res,next) => {
    const {id} = req.params
    const userId = req.user.id
    try{
        const travelStory = await TravelStory.findOne({
            _id: id,
            userId: userId,
        })
        if(!travelStory){
            next(errorHandler(404, "Travel Story not found!"))
        }
        // ✅ Extract fileId from DB (you should save fileId in your TravelStory schema)
        const fileId = travelStory.imageFileId; // <-- you need to save this at create time

        if (fileId) {
        try {
            await imagekit.deleteFile(fileId); // Delete image from ImageKit
        } catch (err) {
            console.error("Error deleting image from ImageKit:", err);
        }
        }

        // ✅ Delete story from DB
        await travelStory.deleteOne();

        res.status(200).json({
            story: travelStory,
            message: "Travel Story deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}

export const updateIsFavourite = async (req,res,next) => {
    const {id} = req.params;
    const {isFavourite} = req.body;

    const userId = req.user.id;
    try{
        const travelStory = await TravelStory.findOne({_id:id, userId: userId})
        if(!travelStory){
            next(errorHandler(404, "travel story not found"))
        }

        travelStory.isFavourite = isFavourite;

        await TravelStory.save();

        res.status(200).json({story: travelStory, message: "Updated Successfully"});
        
    }catch(error){
        next(error)
    }
}

export const searchTravelStory = async (req,res,next) => {

    const {query} = req.query
    const userId = req.user.id

    if(!query){
        return next(errorHandler(404, "Query is required!"))
    }
    try{
        const searchResults = await TravelStory.find({
            userId: userId,
            $or: [
                {title: {$regex: query, $options: "i"}},
                {story: {$regex: query, $options: "i"}},
                {visitedLocation: {$regex: query, $options: "i"}}
            ]
        }).sort({isFavourite: -1});

        res.status(200).json({
            stories: searchResults,
        })

    }catch(error){
        next(error)
    }

}

export const filterTravelStories = async (req,res,next) => {
    const {startDate, endDate} = req.query
    const userId = req.user.id

    try{
        const start = new Date(parseInt(startDate))
        const end = new Date(parseInt(endDate))

        const filteredStories = await TravelStory.find({
            userId: userId,
            visitedDate : {$gte: start, $lte: end}
        }).sort({ isFavourite: -1});

        res.status(200).json({stories: filteredStories})

    }catch(error){
        next(error)
    }
}