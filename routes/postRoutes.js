import express from "express";
import multer from "multer";
import path from "path";
import Post from "../models/post.js";

import { isLoggedIn } from "../middleware.js";
const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder to save files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter (optional)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images are allowed!"), false);
};

const upload = multer({ storage, fileFilter });

// POST route
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const newPost = new Post({
      caption: req.body.caption,
      image: req.file ? req.file.filename : null,
    });
    await newPost.save();
    res.status(200).json({ message: "Post uploaded successfully", post: newPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/new", (req, res) => {
  res.render("upload");
});

// Show all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render("feed", { posts });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const newPost = new Post({
      caption: req.body.caption,
      image: req.file ? req.file.filename : null,
      user: req.user ? req.user._id : null, // store user ID
    });

    await newPost.save();
    res.status(200).json({ message: "Post uploaded successfully", post: newPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/upload", isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const newPost = new Post({
      caption,
      image,
      author: req.user._id
    });
    await newPost.save();

    res.redirect("/myaccount");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading post");
  }
});
router.post("/like/:postId", async(req, res) => {
  const post = await Post.findById(req.params.postId);

  // If already liked, unlike it
  if(post.likes.includes(req.user._id)){
    post.likes.pull(req.user._id);
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();
  res.redirect("back"); // Stay on same page
});



export default router;
