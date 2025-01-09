import { Router } from "express";
import { getAllVideos , publishVideo } from "../controller/videoController";

export const Videorouter = Router();


Videorouter.route("/getAllVideos").get(getAllVideos)

Videorouter.route("/publish").post(
    upload.fields(
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
) , publishVideo)