import mongoose , {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId ,
        ref : "User"
    } , 
    channel : {
        type : Schema.Types.ObjectId ,
        ref : "User"
    } 
} , {
    timestamps : true
} )

export const Subscription = mongoose.models.Subscription || mongoose.model("Subscription" , subscriptionSchema)