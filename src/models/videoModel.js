import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {
        videoFile : {
            type : String ,
            required : true
        } , 
        thumbnail : {
            type : String , 
            required : true
        },
        title : {
            type : String , 
            required : true
        },
        description : {
            type : String , 
            required : true
        },
        duration : {
            type : Number , 
            required : true
        },
        views : {
            type : String , 
            default : 0
        },
        isPublished : {
            type : Boolean, 
            default : true
        } , 
        owner : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        }
       
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

videoSchema.index({title : "text" , description : "text"} , {name : "search-videos"})



export const Video = mongoose.models.Video || mongoose.model("Video",videoSchema) 

// The mongoose-aggregate-paginate-v2 package adds pagination functionality to MongoDB aggregation queries in Mongoose. It simplifies splitting large aggregation results into smaller pages and provides metadata like total documents, total pages, and current page, making it perfect for paginated APIs.
// Aggregation queries in MongoDB are used to process and transform data. Instead of just retrieving raw documents (like a simple find query), aggregation queries allow you to perform operations like filtering, sorting, grouping, and calculations to analyze or reshape data.