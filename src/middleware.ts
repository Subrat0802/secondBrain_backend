import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const userMiddleware = async (req:Request, res:Response, next:NextFunction) => {
    try{
        const token = req.cookies.token || req.headers["authorization"];
        if(!process.env.JWT_SECRET){
            throw new Error("Jwt secret is not defined is environment variable");
        }
        const decode = await jwt.verify(token as string, process.env.JWT_SECRET);

        if(decode){
            // @ts-ignore
            req.userId = decode?.id;
            next();
        }else{
            res.status(411).json({
                message:"Invalid token something went wrong, please login again"
            })
            return;
        }

    }catch(error){
        res.status(500).json({
            message:"Error while validating token, Internal server error",
            error:error
        })
    }
}
