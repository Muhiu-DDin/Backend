import cloudinary from 'cloudinary';
import fs from 'fs';

import dotenv from 'dotenv';
dotenv.config();


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });

  const uploadOnCloudinary = async (localfilePath) => {
    console.log("Cloudinary Configuration:", cloudinary.config());
    console.log("Cloudinary Config - Cloud Name:", process.env.CLOUD_NAME);
    console.log("Cloudinary API Secret:", process.env.API_SECRET);
    console.log("Checking file existence:", fs.existsSync(localfilePath));
    try {
      const result = await cloudinary.v2.uploader.upload(localfilePath, {
        resource_type: 'auto',
      });
      console.log("Cloudinary Upload Success:", result);
      fs.unlinkSync(localfilePath)
      return result;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      fs.unlinkSync(localfilePath)
      return null;
    }
  };
  
export default uploadOnCloudinary;
