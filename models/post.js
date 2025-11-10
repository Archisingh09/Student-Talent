import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  caption: { type: String, required: true },
  image: { type: String,   },
  video: { type: String, },
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

});


const Post= mongoose.model("Post", postSchema);



export default Post;

