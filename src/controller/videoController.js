import { asyncHandler } from "../utils/asyncHandler.js"
import {Video} from "../models/videoModel.js"
import {Likes} from "../models/likesoModel.js"
import {Comment} from "../models/commentMode.js"
import { ApiError } from "../utils/apiError.js";
import { ApiRes } from "../utils/res.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import {deleteOnCloudinary} from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";


export const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userName } = req.query;

    const videos = await Video.aggregate([

        {
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }
        },

        {
            $match: { isPublished: true }
        },

        userName ? {
            $match: { userName: userName }
        } : {},

        (sortBy && sortType) ? {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        } : {
            createdAt: -1
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    { 
                        $project: {
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },

        {
            $addFields: {
                ownerDetails: {
                    $first: "$ownerDetails"
                }
            }
        }

    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = await Video.aggregatePaginate(videos, options);

    return res.status(200).json({
        status: 200,
        data: video,
        message: "Videos fetched successfully"
    });
});

export const publishVideo = asyncHandler(
    async(req , res)=>{

        const {description , title} = req.body

    if([description , title ].some(
        (field)=>field.trim() === ""
    )){
        throw new ApiError(402 , "fields are required")
    }
    // videoFile is the field name used in your file upload form or the name value specified when using Multer to handle file upload
    // const fileLocalPath = req.files?.videoFile[0].path
    // ;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if(!fileLocalPath){
        throw new ApiError(502 , "invalid file path")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(502 , "invalid thumbnail path")
    }

    const videoFile = await uploadOnCloudinary(fileLocalPath)

    console.log("video file=>", videoFile)

    if(!videoFile){
        throw new ApiError(502 , "error in uploading video file ")
    }

    const Videothumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    console.log("Videothumbnail=>", Videothumbnail)

    if(!Videothumbnail){
        throw new ApiError(502 , "error in uploading Videothumbnail ")
    }

    const videoObj = Video.create(
        {
            title ,
            description ,
            thumbnail : Videothumbnail?.url,
            videoFile : videoFile?.url,
            duration : videoFile.duration,
            owner : req.user?._id ,
            isPublished : true

        }
    )
        const video = await Video.findById(videoObj._id)

        if(!video){
            throw new ApiError(502 , "error in publishing video")
        }

        return res
        .status(200)
        .json(new ApiRes(200, "Video uploaded successfully" , video));









    }
)

export const getVideoById = asyncHandler(

    async(req , res)=>{

        const{videoId} = req.params

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoId");
        }
    
        if (!isValidObjectId(req.user?._id)) {
            throw new ApiError(400, "Invalid userId");
        }
        
       const video = await Video.aggregate([
           {
                $match : {
                    _id : new mongoose.Types.ObjectId(videoId)
                } 
           } ,

           {
            $lookup : {
                from : "Likes",
                localField : "_id",
                foreignField : "Video",
                as : "likes"
            } ,

           } ,

           {
            $lookup: {
                from : "Comment",
                localField : "_id",
                foreignField : "video",
                as : "comments"
            } 
           },

           {
            $lookup : {
                from : "User",
                localField : "owner",
                foreignField : "_id",
                as : "ownerDetail",
                pipeline : [
                    {
                        $lookup : {
                            from : "Subscription" , 
                            localField : "_id" , 
                            foreignField : "channel" ,
                            as : "subscribers"
                        }
                    } , 
                    {
                        $addFields : {
                            subsCount : {
                                $size : "$subscribers"
                            }
                        }
                    },
                    {
                        $project : {
                            userName : 1 ,
                            avtar : 1 ,
                        }

                    }
                ]
            }
            } , 

            {
                $addFields : {
                    likesCount : {
                        $size : "$likes"
                    } , 
                    owner : {
                        $first : "$ownerDetail"
                    }
                }
            } , 
            {
                $project : {
                    videoFile: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    createdAt: 1,
                    duration: 1,
                    comments: 1,
                    owner: 1,
                    likesCount: 1,
                }
            }
       ])

      await Video.findByIdAndUpdate(
        req.user._id , 
        {
            $addToSet : {
                watchHistory : "videoId"
            }
        }
       )

       await User.findByIdAndUpdate(
        videoId, 
        {
            $inc : {
                views : 1
            }
        }
       )
       
    return res
    .status(200)
    .json(
        new ApiRes(200 , "video details fetched successfully" ,video[0])
    );
    }
)

export const updateVideoDetails = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { videoId } = req.params;

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(401, "User does not exist");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(401, "Video not found");
    }

    if (req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(401, "Only the owner can edit the video");
    }

    if (!(title && description)) {
        throw new ApiError(401, "Title and description are required");
    }

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(401, "Invalid thumbnail");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(401, "Failed to upload thumbnail");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail:{
                    public_id : thumbnail.public_id , 
                    url : thumbnail.url
                },
            },
        },
        { new: true }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video, please try again");
    }

    return res
        .status(200)
        .json(new ApiRes(200, "Video updated successfully", updatedVideo));
});

export const deleteVideo = asyncHandler(
    async (req, res) => {
        const { videoId } = req.params;

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID");
        }

        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        if (req.user?._id.toString() !== video.owner.toString()) {
            throw new ApiError(403, "Only the owner can delete the video");
        }

        // This line deletes all documents (or "records") in the Like collection that are associated with the given videoId.
        await Likes.deleteMany({ video: videoId });

        
        await Comment.deleteMany({ video: videoId });

        const videoDeleted = await Video.findByIdAndDelete(videoId);

        if (!videoDeleted) {
            throw new ApiError(400, "Failed to delete the video, please try again");
        }

        // The public_id is generated by Cloudinary automatically when the file is uploaded.
        // The delete function typically requires the public_id of the file to delete it from Cloudinary.
        if (video?.videoFile?.public_id) {
            await deleteOnCloudinary(video.videoFile.public_id, "video");
        }
        if (video?.thumbnail?.public_id) {
            await deleteOnCloudinary(video.thumbnail.public_id);
        }

        return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
    }
);
 
export const publishTogler = asyncHandler(
    async(req , res) => {
        const {videoId} = req.params

        if(!isValidObjectId){
            throw new ApiError(404 , "invalid video")
        }
        const video = await Video.findById(videoId);

        if(req.user._id.toString() !== video.owner.toString()){
            throw new ApiError(404 , "only aunthenticated user can publish")
        }

       const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId , 
        {
            $set : !video.isPublished
        } , 
        {new : true}
       )
       
       if(!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res
    .status(200)
    .json(
        new ApiRes(
            200,
            "Video publish toggled successfully" ,
            { isPublished: toggledVideoPublish.isPublished },
        )
    );
    }
)