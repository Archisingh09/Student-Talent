import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";


// Define schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // passport-local-mongoose will handle hashing
    bio: {
      type: String,
      default: "none",
    },
    profilePicture: {
      type: String,
      
    },
    
    talentCategory:{
      type: String,
      default:" none "
    }
  },
  { timestamps: true }
);



// Add passport-local-mongoose plugin
userSchema.plugin(passportLocalMongoose);

// Export model
export default mongoose.model("User", userSchema);



