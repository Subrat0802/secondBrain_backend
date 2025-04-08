import express from "express";
import * as dotenv from "dotenv";
import {
  userContentZodValidation,
  userSigninZodValidation,
  userZodvalidation,
} from "./utils";
import { contentModel, linkModel, userModel } from "./db";
import bcrypt from "bcrypt";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import { userMiddleware } from "./middleware";

const app = express();
dotenv.config();
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_LINK,
    credentials: true,
  })
);
app.use(express.json());
const PORT = process.env.PORT;

app.post("/api/v1/signup", async (req, res) => {
  try {
    // console.log("username", req.body);
    const zodeAuthValidation = await userZodvalidation.parseAsync(req.body);

    const { username, email, password } = zodeAuthValidation;

    const checkEmail = await userModel.findOne({ email: email });

    if (checkEmail) {
      res.status(409).json({
        message: "Email is already present, typy with different email address",
      });
      return;
    }

    const passwordHashed = await bcrypt.hash(password, 10);

    const response = await userModel.create({
      email,
      password: passwordHashed,
      username,
    });
    if (!response) {
      res.status(408).json({
        messgae: "Error while signup, new user",
      });
      return;
    }
    res.status(200).json({
      message: "User is successfully created",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(404).json({
        message: "validation error",
        error: error.errors,
      });
    } else {
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
});

app.post("/api/v1/signin", async (req, res) => {
  try {
    const zodvalidation = await userSigninZodValidation.parseAsync(req.body);
    const { email, password } = zodvalidation;

    const existingUser = await userModel.findOne({ email });
    if (!existingUser) {
      res.status(404).json({
        message: "user is not present, please signup first with this email",
      });
      return;
    }
    const matchpassword = await bcrypt.compare(
      password,
      existingUser?.password
    );

    if (!matchpassword) {
      res.status(409).json({
        message: "Password is incorrect",
      });
      return;
    }

    const option = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables.");
    }

    const token = jwt.sign(
      {
        id: existingUser._id,
        email: existingUser.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.cookie("token", token, option).status(200).json({
      message: "User signin successfully",
      token: token,
      user: existingUser,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(404).json({
        message: "validation error",
        error: error.errors,
      });
    } else {
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
});

app.post("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    const zodvalidation = await userContentZodValidation.parseAsync(req.body);

    const { title, link, type } = zodvalidation;

    const createContent = await contentModel.create({
      title,
      link,
      type,
      //@ts-ignore
      userId: req?.userId,
      // tag:[]
    });
    if (!createContent) {
      res.status(409).json({
        message: "Error while crateing content, try again.",
      });
      return;
    }

    res.status(200).json({
      message: "Your new content is created",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(408).json({
        message: "Validation Error",
        error: error.errors,
      });
    } else {
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
});

app.get("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req?.userId;
    const checkUser = await userModel.findOne({ _id: userId });
    if (!checkUser) {
      res.status(409).json({
        message: "invalid credentials(token), please login again",
      });
      return;
    }
    const response = await contentModel.find({ userId: userId });

    if (!response) {
      res.status(409).json({
        message: "No content",
      });
      return;
    }

    res.status(200).json({
      message: "All content",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    const { postId } = req.body;
    //@ts-ignore
    const userId = req?.userId;

    const checkUser = await contentModel.findOne({
      _id: postId,
      userId: userId,
    });
    if (!checkUser) {
      res.status(408).json({
        message: "Post is not available",
      });
      return;
    }

    const deleteContent = await contentModel.deleteOne(
      { _id: postId },
      { new: true }
    );

    res.status(200).json({
      message: "Content Deleted succesfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req?.userId;
    const hash = await bcrypt.hash(userId, 10);

    const user = await userModel.findOne({ _id: userId });

    if (!user) {
      res.status(403).json({
        message: "Invaild token.",
      });
      return;
    }

    const checkLink = await linkModel.findOne({
      userId: user._id,
    });

    if (checkLink) {
      res.status(404).json({
        message: "Your share link is already created",
        hash: checkLink.hash,
      });
      return;
    }

    const createHash = await linkModel.create({ hash: hash, userId: user._id });

    res.status(200).json({
      hash: createHash.hash,
      user: createHash.userId,
      message: "share link is created",
    });
  } catch (error) {
    res.status(404).json({
      error: error,
      message: "internal server error",
    });
  }
});

app.get("/api/v1/brain/:shareLink", userMiddleware, async (req, res) => {
  try {
    const { shareLink } = req.params;
    //@ts-ignore
    const userId = req?.userId;

    if (!shareLink) {
      res.status(400).json({
        message: "Invalid link",
      });
      return;
    }

    const findLink = await linkModel.findOne({
      hash: shareLink,
    });

    if (!findLink) {
      res.status(402).json({
        message: "Content is not sharable",
      });
      return;
    }

    const findContent = await contentModel.find({ userId: findLink.userId });

    if (!findContent) {
      res.status(400).json({
        message: "No content found",
      });
      return;
    }

    res.status(200).json({
      message: "All contents created by user",
      content: findContent,
    });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal server error",
    });
  }
});

app.get("/api/v1/me", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req?.userId;
    if (!userId) {
      res.status(404).json({
        message: "User is not loggedIn, try again (token is missing)",
      });
      return;
    } else {
      res.status(200).json({
        message: "User is logged in",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server error while validating token",
    });
  }
});

app.listen(PORT, () => {
  console.log("App is running at port", PORT);
});