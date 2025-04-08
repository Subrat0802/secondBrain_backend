import {z} from "zod";

// export function random(len: number){
//     let options = "qwertyuiopasdfghjklmnbvcxz12345678";
//     let length = options.length
//     let ans = "";
//     for(let i = 0; i < len; i++){
//         ans+=options[Math.floor((Math.random() *  length))]
//     }
//     return ans;
// }


export const userZodvalidation = z.object({
    username:z.string().min(1, {message:"username is required"}),
    email:z.string().email(),
    password:z.string().min(6),
    confirmPassword:z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
    message:"Password must match!",
    path:["confirmPassword"]
}) 

export const userSigninZodValidation = z.object({
    email:z.string().email(),
    password:z.string().min(6)
})


export const userContentZodValidation = z.object({
    title:z.string().min(1, {message:"Title is required"}),
    link:z.string().min(1, {message:"Link is required"}),
    type:z.string().min(1, {message:"Message is required"})
})
