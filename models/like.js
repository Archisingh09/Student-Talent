import express from "express";
import Post from "../models/post.js";
import { ensureAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/like/:id", ensureAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).send("Post not found");

    if (post.likes.includes(req.user._id)) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.redirect("back");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

export default router;
