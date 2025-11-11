import express from "express";
import multer from "multer";
import passport from "passport";
import path from "path";
import fs from "fs";
import User from "./models/user.js";
import Post from "./models/post.js";
import upload from "./middleware/upload.js";



import wrapasync from  "./utils/wrapasync.js";
import ExpressError  from "./utils/ExpressError.js";


const router = express.Router();
//  🆕 Route to show a single post
router.get("/post/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("user");
    if (!post) {
      return res.status(404).send("Post not found");
    }

    res.render("postdetails", { post });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// -----------------------------------------------------------
// 🔐 AUTH MIDDLEWARE
// -----------------------------------------------------------
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("error", "Please log in first");
  res.redirect("/login");
}



// -----------------------------------------------------------
// 🏠 BASIC ROUTES
// -----------------------------------------------------------
router.get("/index", ensureAuth, (req, res) => 
  res.render("index"));

// router.get("/signup", (req, res) =>
//    res.render("signup"));

router.get("/onlyvisitors", (req,res)=>
  res.render("onlyvisitors"));

router.get("/signup", (req, res) => {
  res.render("signup", { success: req.flash("success"), error: req.flash("error") });
});




// router.post("/signup", async (req, res) => {
//   try {
//     const { username, email, password } = req.body;
//     const newUser = new User({ username, email });
//     const registeredUser = await User.register(newUser, password);
//     console.log("✅ Registered User:", registeredUser);

//     req.flash("success", "Welcome to Student Social!");
//     res.redirect("/feed");
//   } catch (e) {
//     console.error("❌ Signup Error:", e);

//     // ✅ Handle duplicate username and email
//     if (e.name === "UserExistsError") {
//       req.flash("error", "Username already taken. Please choose another.");
//     } else if (e.code === 11000) {
//       req.flash("error", "Email already registered. Try logging in.");
//     } else {
//       req.flash("error", "Something went wrong. Please try again.");
//     }

//     res.redirect("/signup");
//   }
// });
router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);
    console.log("✅ Registered User:", registeredUser);

    // ✅ Log the user in after successful signup
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Student Social!");
      return res.redirect("/feed");
    });

  } catch (e) {
    console.error("❌ Signup Error:", e);

    // ✅ Handle duplicate username and email
    if (e.name === "UserExistsError") {
      req.flash("error", "Username already taken. Please choose another.");
    } else if (e.code === 11000) {
      req.flash("error", "Email already registered. Try logging in.");
    } else {
      req.flash("error", "Something went wrong. Please try again.");
    }

    res.redirect("/signup");
  }
});

// Login routes
router.get("/login", (req, res) => res.render("login"));
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/feed",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Welcome back!",
  })
);

//logout route

router.get("/logout", (req,res,next)=>{
  req.logout((err) =>{
    if(err){
      next(err);
    }
    req.flash("success"," You are logged out");
    res.redirect("/signup");
  })
})
// -----------------------------------------------------------
// 👤 USER PROFILE (FIXED)
// -----------------------------------------------------------

// ✅ Show Edit Profile Page
router.get("/edit", ensureAuth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.render("edit.ejs", { user });
});

router.post("/edit", ensureAuth, upload.single("image"), async (req, res) => {
  try {
    const { bio, talentCategory } = req.body;
    const updateData = { bio, talentCategory };

    // If new image uploaded
    if (req.file) {
      const user = await User.findById(req.user._id);

      // Delete old one if exists
      if (user.profilePicture && user.profilePicture !== "/uploads/default.jpg") {
        const oldPath = path.join(process.cwd(), "public", user.profilePicture);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      // Save new image path (no /public here!)
      updateData.profilePicture = "/uploads/" + req.file.filename;
    }

    await User.findByIdAndUpdate(req.user._id, updateData);
    req.flash("success", "Profile updated successfully!");
    res.redirect("/myaccount");
  } catch (err) {
    console.error("❌ Edit Error:", err);
    res.status(500).send("Error updating profile");
  }
});


// -----------------------------------------------------------
// 🖼️ POSTS
// -----------------------------------------------------------
// ✅ Upload a Post
router.post("/upload", ensureAuth, upload.single("file"), async (req, res) => {
  try {

    let imageFile = null;
    let videoFile = null;

    // Check the uploaded file type
    if (req.file) {
      if (req.file.mimetype.startsWith("image")) {
        imageFile = req.file.filename;  // Store in image
      } else if (req.file.mimetype.startsWith("video")) {
        videoFile = req.file.filename;  // Store in video
      }
    }

    const newPost = new Post({
      user: req.user._id,
      caption: req.body.caption,
      image: imageFile,
      video: videoFile,
    });

    await newPost.save();
    req.flash("success", "Post uploaded successfully!");
    res.redirect("/myaccount");

  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).send("Error uploading post");
  }
});


// ✅ Delete a Post (individual)
router.post("/delete-post/:id", ensureAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    if (String(post.user) !== String(req.user._id)) return res.status(403).send("Unauthorized");

    // Delete image file if exists
    if (post.image) {
      const imagePath = path.join(process.cwd(), "public", "uploads", post.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await Post.findByIdAndDelete(req.params.id);
    req.flash("success", "Post deleted successfully!");
    res.redirect("/myaccount");
  } catch (err) {
    console.error("❌ Delete Error:", err);
    res.status(500).send("Error deleting post");
  }
});

// ✅ Delete Account
router.post("/delete", ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.profilePicture) {
      const filePath = path.join(process.cwd(), "public", user.profilePic);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Post.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);

    req.logout(err => {
      if (err) console.error("Logout error:", err);
    });

    req.flash("success", "Your account and posts were deleted successfully.");
    res.redirect("/signup");
  } catch (err) {
    console.error("❌ Account Delete Error:", err);
    res.status(500).send("Error deleting account");
  }
});

// ✅ My Account
router.get("/myaccount", ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await Post.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.render("myaccount", { user, posts });
  } catch (err) {
    console.error("❌ MyAccount Error:", err);
    res.status(500).send("Error loading account: " + err.message);
  }
});

router.get("/feed", ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await Post.find().populate("user").sort({ createdAt: -1 });

    res.render("feed.ejs", { posts, user }); // ✅ Pass user also
  } catch (err) {
    console.error("❌ Feed Error:", err);
    res.status(500).send("Error loading feed: " + err.message);
  }
});

//for visitors



// ✅ Feed page (all users' posts)
// router.get("/feed", ensureAuth, async (req, res) => {
//   try {
//     const posts = await Post.find().populate("user", "username email").sort({ createdAt: -1 });
//     res.render("feed", { posts });
//   } catch (err) {
//     console.error("❌ Feed Error:", err);
//     res.status(500).send("Error loading feed");
//   }
// });
// 

// ✅ SEARCH FUNCTIONALITY
router.get("/search", ensureAuth, async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) return res.redirect("/feed");

    const regex = new RegExp(query, "i"); // case-insensitive search

    // Find matching users and posts
    const users = await User.find({
      $or: [{ username: regex }, { talentCategory: regex }],
    });

    const posts = await Post.find({ caption: regex })
      .populate("user", "username");

    res.render("searchResults.ejs", { query, users, posts });
  } catch (error) {
    console.error("❌ Search Error:", error);
    res.status(500).send("Error performing search");
  }
});// ✅ View another user's public profile
router.get("/profile/:id", ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");

    const posts = await Post.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.render("profile.ejs", { user, posts });
  } catch (err) {
    console.error("❌ Profile Error:", err);
    res.status(500).send("Error loading profile");
  }
 });

 router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    const posts = await Post.find({ user: req.params.id }).sort({ createdAt: -1 });

    res.render("profile.ejs", { user, posts });
  } catch (err) {
    console.log(err);
    res.redirect("/feed");
  }
});
router.post("/like/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user._id;

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      liked: !alreadyLiked,
      likesCount: post.likes.length,
    });
  } catch (err) {
    console.error("Like route error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get('/posts/:id', async (req, res) => {
  if (!req.params.id || req.params.id === 'undefined') {
    return res.status(400).send('Invalid post ID');
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');
    res.render('post', { post });
  } catch (err) {
    console.error('🔥 Error fetching post:', err);
    res.status(500).send('Server error');
  }
});
router.delete('/posts/delete/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('🔥 Error deleting post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// route error handler

router.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).json({ error: message });
});



export default router;
