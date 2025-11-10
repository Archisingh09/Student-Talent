import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import passport from "passport";
import session from "express-session";
import flash from "connect-flash";
import LocalStrategy from "passport-local";
import User from "./models/user.js";    // ✅ Correct User model
import userRoutes from "./user.js";     // ✅ Routes file (make sure it's using export default)
import ejsMate from "ejs-mate";    

import upload from "./middleware/upload.js";
import Post from "./models/post.js";
import postRoutes from "./routes/postRoutes.js"
import wrapasync from  "./utils/wrapasync.js";
import ExpressError from "./utils/ExpressError.js";


const router = express.Router();



dotenv.config();
const app = express(); 
// Middlewares
app.use(express.urlencoded({ extended: true })); // form data

app.use(express.static("public"));               // static files (css, uploads)
app.use("/uploads", express.static("middleware/uploads"));


app.use("/posts", postRoutes );
app.use("/users", userRoutes);
// app.use('/users', require('user'));

app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/uploads", express.static("public/uploads"));

// EJS setup
app.engine("ejs", ejsMate); 
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.set("users", path.join(process.cwd(),"users"));





// Session config
const sessionConfig = {
    secret: "thisshouldbeabettersecret",  // ⚠️ move to .env in production
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};


app.use(session(sessionConfig))
// flash middleware


app.use(session({
  secret: "yourSecretKey", // use process.env.SECRET in production
  resave: false,
  saveUninitialized: false
}));

app.use(flash());

// ✅ Make flash messages available in all EJS views
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash middleware (so messages work in views)
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

// Routes (AFTER session + passport setup)
app.use("/", userRoutes);

app.get("/", (req, res) => {
    res.render("signup.ejs");
});
app.get("/index",(req,res) =>{
  res.render("index.ejs");
});
import likeRoutes from "./models/like.js";
app.use("/", likeRoutes);


// app.get("/index", (req,res) =>{
//   res.render("feed.ejs");
// });

app.get("/myaccount", (req,res) =>{
    res.render("myaccount")
})


//for databade
mongoose.connect("mongodb://127.0.0.1:27017/student-Social")
  .then(() => {
      console.log("✅ MongoDB Connected");
  })
  .catch(err => {
      console.log("❌ Mongo Connection Error:", err);
  });


// Demo user route

app.post("/users/:id/post", upload.single("media"), async (req, res) => {
  try {
    const newPost = new Post({
      user: req.params.id,
      caption: req.body.caption,
      media: `/uploads/${req.file.filename}`,
    });
    await newPost.save();
    res.redirect(`/users/${req.params.id}/profile`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
// ✅ Catch all undefined routes
app.use((req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});


// ✅ Error handler (after all routes)
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error", { message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
