import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";

dotenv.config({path : './.env'});

connectDB()
.then(
    ()=>{
        app.listen(process.env.PORT , ()=> console.log("DB Connected!!!"))
         console.log(`Server is running on http://localhost:${process.env.PORT}`)
    }
).catch(
    (e)=> console.log("error =>" , e)
)