import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./Public/Temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  // instance of multer 
export const upload = multer({ 
    storage, 
})