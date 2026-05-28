import { postService, PostService } from "../post.service";
import { IAuthUser } from "../../../common/types/express.types";
import { GQLValidation } from "../../../middleware";
import {
  PagiateDto,
  paginationValidationSchema,
} from "../../../common/validation";
import { reactOnPostGQL } from "../post.validation";
import { ReactOnPostArgsDto } from "../post.dto";

export class PostResolver {
  private postService: PostService;
  constructor() {
    this.postService = postService;
  }
  postList = async (
    _parent: unknown,
    args: PagiateDto,
    { user }: IAuthUser,
  ): Promise<any> => {
    await GQLValidation<PagiateDto>(paginationValidationSchema.query, args);
    const data = await this.postService.postList({ user }, args);
    return { message: "Done", data };
  };

  reactOnPost = async (
    _parent: unknown,
    { postId, react }: ReactOnPostArgsDto,
    { user }: IAuthUser,
  ): Promise<any> => {
    await GQLValidation<ReactOnPostArgsDto>(reactOnPostGQL, { postId, react });
    const data = await this.postService.reactPost({ postId }, { react }, user);
    return { message: "Done", data };
  };
}

export const postResolver = new PostResolver();
