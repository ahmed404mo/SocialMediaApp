import { connect } from "mongoose"
import { DB_URI } from "../config/config"

const connectDB = async()=>{
  try {
    await connect(DB_URI, {serverSelectionTimeoutMS:30000})
    console.log(`DB connected successfully 🌸`);
    
  } catch (error) {
    console.log(`Fail on connect DB ... ${error}`);
    
  }
}

export default connectDB