import mongoose, { model } from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const MONGODBURL = process.env.MONGODB_URL; 

if(!MONGODBURL){
  throw new Error("MONGODB_URL is not defined in .env");
}

mongoose.connect(MONGODBURL);

const userSchema = new mongoose.Schema({ 
  username: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

export const userModel = model("User", userSchema);

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  // tag: [
  //   {
  //     type: mongoose.Types.ObjectId,
  //     ref: "Tag",
  //   },
  // ],
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  }
});

export const contentModel = model("Content", contentSchema);

const linkSchema = new mongoose.Schema({
  hash: {
    type: String,
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export const linkModel = model("Link", linkSchema);