import z from "zod";
import { createPost, reactOnPostGQL, reactPost, updatePost } from "./post.validation";

export type CreatePostBodyDto = z.infer<typeof createPost.body>
export type ReactPostQueryDto = z.infer<typeof reactPost.query>
export type ReactPostParamsDto = z.infer<typeof reactPost.params>

export type updatePostBodyDto = z.infer<typeof updatePost.body>
export type updatePostParamsDto = z.infer<typeof updatePost.params>


export type ReactOnPostArgsDto = z.infer<typeof reactOnPostGQL>