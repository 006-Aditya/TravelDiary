// multer.js
import multer from "multer"

// store file in memory (not on disk)
const storage = multer.memoryStorage()

// file filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only images are allowed"), false)
  }
}

const upload = multer({ storage, fileFilter })

export default upload
