import mongoose from "mongoose"

const playlistSchema = new mongoose.Schema(
    {
       owner : {    
        type : mongoose.Types.ObjectId , 
        ref : "User"
       }
       ,
       videos : [
        {
            type : mongoose.Types.ObjectId,
            ref : "Video"
        }
    ], 
    name : {
        type : String , 
        required : true
    } , 
    discription : {
        type : String , 
        required : true ,
    }

    } ,
    {
        timestamps : true
    }
)

export const Playlist = mongoose.models.Playlist || mongoose.models("Playlist",playlistSchema)