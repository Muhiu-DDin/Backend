import mongoose from "mongoose";
import { DBName } from "../constant.js";

export async function connectDB(){
try{
    const mongooseData = await mongoose.connect(`${process.env.MONGODB_URL}/${DBName}`);
    if(mongooseData.connection.readyState === 1){
        console.log("DB Connected Successfully")
    }

}catch(e){
    console.error("db connection failed =>" , e)
}
}