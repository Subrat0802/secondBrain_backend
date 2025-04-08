"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
const utils_1 = require("./utils");
const db_1 = require("./db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const middleware_1 = require("./middleware");
const app = (0, express_1.default)();
dotenv.config();
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_LINK,
    credentials: true,
}));
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // console.log("username", req.body);
        const zodeAuthValidation = yield utils_1.userZodvalidation.parseAsync(req.body);
        const { username, email, password } = zodeAuthValidation;
        const checkEmail = yield db_1.userModel.findOne({ email: email });
        if (checkEmail) {
            res.status(409).json({
                message: "Email is already present, typy with different email address",
            });
            return;
        }
        const passwordHashed = yield bcrypt_1.default.hash(password, 10);
        const response = yield db_1.userModel.create({
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
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(404).json({
                message: "validation error",
                error: error.errors,
            });
        }
        else {
            res.status(500).json({
                message: "Internal server error",
            });
        }
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const zodvalidation = yield utils_1.userSigninZodValidation.parseAsync(req.body);
        const { email, password } = zodvalidation;
        const existingUser = yield db_1.userModel.findOne({ email });
        if (!existingUser) {
            res.status(404).json({
                message: "user is not present, please signup first with this email",
            });
            return;
        }
        const matchpassword = yield bcrypt_1.default.compare(password, existingUser === null || existingUser === void 0 ? void 0 : existingUser.password);
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
        const token = jsonwebtoken_1.default.sign({
            id: existingUser._id,
            email: existingUser.email,
        }, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });
        res.cookie("token", token, option).status(200).json({
            message: "User signin successfully",
            token: token,
            user: existingUser,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(404).json({
                message: "validation error",
                error: error.errors,
            });
        }
        else {
            res.status(500).json({
                message: "Internal server error",
            });
        }
    }
}));
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const zodvalidation = yield utils_1.userContentZodValidation.parseAsync(req.body);
        const { title, link, type } = zodvalidation;
        const createContent = yield db_1.contentModel.create({
            title,
            link,
            type,
            //@ts-ignore
            userId: req === null || req === void 0 ? void 0 : req.userId,
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
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(408).json({
                message: "Validation Error",
                error: error.errors,
            });
        }
        else {
            res.status(500).json({
                message: "Internal server error",
            });
        }
    }
}));
app.get("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const userId = req === null || req === void 0 ? void 0 : req.userId;
        const checkUser = yield db_1.userModel.findOne({ _id: userId });
        if (!checkUser) {
            res.status(409).json({
                message: "invalid credentials(token), please login again",
            });
            return;
        }
        const response = yield db_1.contentModel.find({ userId: userId });
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
app.delete("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.body;
        //@ts-ignore
        const userId = req === null || req === void 0 ? void 0 : req.userId;
        const checkUser = yield db_1.contentModel.findOne({
            _id: postId,
            userId: userId,
        });
        if (!checkUser) {
            res.status(408).json({
                message: "Post is not available",
            });
            return;
        }
        const deleteContent = yield db_1.contentModel.deleteOne({ _id: postId }, { new: true });
        res.status(200).json({
            message: "Content Deleted succesfully",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
app.post("/api/v1/brain/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req === null || req === void 0 ? void 0 : req.userId;
        const hash = yield bcrypt_1.default.hash(userId, 10);
        const user = yield db_1.userModel.findOne({ _id: userId });
        if (!user) {
            res.status(403).json({
                message: "Invaild token.",
            });
            return;
        }
        const checkLink = yield db_1.linkModel.findOne({
            userId: user._id,
        });
        if (checkLink) {
            res.status(404).json({
                message: "Your share link is already created",
                hash: checkLink.hash,
            });
            return;
        }
        const createHash = yield db_1.linkModel.create({ hash: hash, userId: user._id });
        res.status(200).json({
            hash: createHash.hash,
            user: createHash.userId,
            message: "share link is created",
        });
    }
    catch (error) {
        res.status(404).json({
            error: error,
            message: "internal server error",
        });
    }
}));
app.get("/api/v1/brain/:shareLink", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shareLink } = req.params;
        //@ts-ignore
        const userId = req === null || req === void 0 ? void 0 : req.userId;
        if (!shareLink) {
            res.status(400).json({
                message: "Invalid link",
            });
            return;
        }
        const findLink = yield db_1.linkModel.findOne({
            hash: shareLink,
        });
        if (!findLink) {
            res.status(402).json({
                message: "Content is not sharable",
            });
            return;
        }
        const findContent = yield db_1.contentModel.find({ userId: findLink.userId });
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
    }
    catch (error) {
        res.status(500).json({
            error: error,
            message: "Internal server error",
        });
    }
}));
app.get("/api/v1/me", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req === null || req === void 0 ? void 0 : req.userId;
        if (!userId) {
            res.status(404).json({
                message: "User is not loggedIn, try again (token is missing)",
            });
            return;
        }
        else {
            res.status(200).json({
                message: "User is logged in",
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server error while validating token",
        });
    }
}));
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
