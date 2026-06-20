const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cookieParser= require('cookie-parser');
const cors = require("cors");
const app = express();
const connetDB = require("./config/mongodb");
const port = process.env.PORT || 4000;
const {
  registerUser,
  getUsers,
  getUserWithEmail,
  userLogin,
  resetPassword,
  logOutUser
} = require("./controller/authController");
const {authRouter}=require('./route/authRouter');



app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true }));

app.listen(port, () => console.log(`Server started at PORT: ${port}`));
connetDB();

app.get("/", (req, res) => {
  res.json("This is home page");
});

app.use('/auth',authRouter);

