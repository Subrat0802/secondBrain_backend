"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userContentZodValidation = exports.userSigninZodValidation = exports.userZodvalidation = void 0;
const zod_1 = require("zod");
// export function random(len: number){
//     let options = "qwertyuiopasdfghjklmnbvcxz12345678";
//     let length = options.length
//     let ans = "";
//     for(let i = 0; i < len; i++){
//         ans+=options[Math.floor((Math.random() *  length))]
//     }
//     return ans;
// }
exports.userZodvalidation = zod_1.z.object({
    username: zod_1.z.string().min(1, { message: "username is required" }),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    confirmPassword: zod_1.z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Password must match!",
    path: ["confirmPassword"]
});
exports.userSigninZodValidation = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
exports.userContentZodValidation = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: "Title is required" }),
    link: zod_1.z.string().min(1, { message: "Link is required" }),
    type: zod_1.z.string().min(1, { message: "Message is required" })
});
