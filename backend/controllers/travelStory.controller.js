import { fileURLToPath } from "url"
import TravelStory from "../models/travelStory.model.js"
import { errorHandler } from "../utils/error.js"
import imagekit from "../configs/imageKit.js";

export const addTravelStory = async (req, res, next) => {
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body

  const userId = req.user.id

  //   validate required field
  if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
    return next(errorHandler(400, "All fields are required"))
  }

  //   convert visited date from milliseconds to Date Object
  const parsedVisitedDate = new Date(parseInt(visitedDate))

  try {
    const travelStory = new TravelStory({
      title,
      story,
      visitedLocation,
      userId,
      imageUrl,
      visitedDate: parsedVisitedDate,
    })

    await travelStory.save()

    res.status(201).json({
      story: travelStory,
      message: "You story is added successfully!",
    })
  } catch (error) {
    next(error)
  }
}

export const getAllTravelStory = async (req, res, next) => {
  const userId = req.user.id

  try {
    const travelStories = await TravelStory.find({ userId: userId }).sort({
      isFavorite: -1,
    })

    res.status(200).json({ stories: travelStories })
  } catch (error) {
    next(error)
  }
}

export const imageUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(errorHandler(400, "No image uploaded"))
    }

    const uploadResponse = await imagekit.upload({
      file: req.file.buffer.toString("base64"), // file in base64
      fileName: req.file.originalname, // keep original name
    })

    return res.status(201).json({ imageUrl: uploadResponse.url })
  } catch (error) {
    console.error("Error uploading image to ImageKit:", error)
    return next(errorHandler(500, "Image upload failed"))
  }
}

export const deleteImage = async (req, res, next) => {
  const { fileId } = req.query // get fileId instead of imageUrl

  if (!fileId) {
    return next(errorHandler(400, "fileId parameter is required!"))
  }

  try {
    await imagekit.deleteFile(fileId)
    res.status(200).json({ message: "Image deleted successfully!" })
  } catch (error) {
    console.error("Error deleting image from ImageKit:", error)
    next(errorHandler(500, "Image delete failed"))
  }
}

export const editTravelStory = async (req, res, next) => {
  const { id } = req.params
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body
  const userId = req.user.id

  if (!title || !story || !visitedLocation || !visitedDate) {
    return next(errorHandler(400, "All fields are required"))
  }

  const parsedVisitedDate = new Date(parseInt(visitedDate))

  try {
    const travelStory = await TravelStory.findOne({ _id: id, userId })

    if (!travelStory) {
      return next(errorHandler(404, "Travel Story not found!"))
    }

    const placeholderImageUrl = process.env.PLACEHOLDER_IMAGE_URL 

    travelStory.title = title
    travelStory.story = story
    travelStory.visitedLocation = visitedLocation
    travelStory.imageUrl = imageUrl || placeholderImageUrl
    travelStory.visitedDate = parsedVisitedDate

    await travelStory.save()

    res.status(200).json({
      story: travelStory,
      message: "Travel story updated successfully!",
    })
  } catch (error) {
    next(error)
  }
}

export const deleteTravelStory = async (req, res, next) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const travelStory = await TravelStory.findOne({ _id: id, userId })

    if (!travelStory) {
      return next(errorHandler(404, "Travel Story not found!"))
    }

    // Save the imageUrl before deleting the DB record
    const imageUrl = travelStory.imageUrl

    // delete travel story from the database
    await travelStory.deleteOne()

    // placeholder image (from env)
    const placeholderImageUrl = process.env.PLACEHOLDER_IMAGE_URL

    // If the image is NOT placeholder, delete from ImageKit
    if (imageUrl && imageUrl !== placeholderImageUrl) {
      // Extract fileId from ImageKit URL (you must store fileId at upload time ideally)
      const fileId = travelStory.imageFileId  // <-- you need to store this in DB when uploading

      if (fileId) {
        await imagekit.deleteFile(fileId)
      }
    }

    res.status(200).json({ message: "Travel story deleted successfully!" })
  } catch (error) {
    next(error)
  }
}

export const updateIsFavourite = async (req, res, next) => {
  const { id } = req.params
  const { isFavorite } = req.body
  const userId = req.user.id

  try {
    const travelStory = await TravelStory.findOne({ _id: id, userId })

    if (!travelStory) {
      return next(errorHandler(404, "Travel story not found!"))
    }

    travelStory.isFavorite = isFavorite
    await travelStory.save()

    res.status(200).json({
      story: travelStory,
      message: "Updated successfully!"
    })
  } catch (error) {
    next(error)
  }
}

export const searchTravelStory = async (req, res, next) => {
  const { query } = req.query
  const userId = req.user.id

  if (!query) {
    return next(errorHandler(400, "Query is required!"))
  }


  try {
    const searchResults = await TravelStory.find({
      userId: userId,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { story: { $regex: query, $options: "i" } },
        { visitedLocation: { $regex: query, $options: "i" } },
      ],
    }).sort({ isFavorite: -1 })

    res.status(200).json({
      stories: searchResults,
    })
  } catch (error) {
    next(error)
  }
}

export const filterTravelStories = async (req, res, next) => {
  const { startDate, endDate } = req.query
  const userId = req.user.id

  try {
    const start = new Date(parseInt(startDate))
    const end = new Date(parseInt(endDate))

    const filteredStories = await TravelStory.find({
      userId: userId,
      visitedDate: { $gte: start, $lte: end },
    }).sort({ isFavorite: -1 })

    res.status(200).json({ stories: filteredStories })
  } catch (error) {
    next(error)
  }
}
