"use strict";
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
exports.userMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.token || req.headers["authorization"];
        if (!process.env.JWT_SECRET) {
            throw new Error("Jwt secret is not defined is environment variable");
        }
        const decode = yield jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decode) {
            // @ts-ignore
            req.userId = decode === null || decode === void 0 ? void 0 : decode.id;
            next();
        }
        else {
            res.status(411).json({
                message: "Invalid token something went wrong, please login again"
            });
            return;
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Error while validating token, Internal server error",
            error: error
        });
    }
});
exports.userMiddleware = userMiddleware;
