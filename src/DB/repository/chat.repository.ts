import { QueryFilter } from "mongoose";
import { IChat } from "../../common/interfaces";
import { ChatModel } from "../model";
import { DatabaseRepository } from "./base.repository";
import { ProjectionType } from "mongoose";
import { QueryOptions } from "mongoose";
import { FlattenMaps } from "mongoose";
import { HydratedDocument } from "mongoose";
import { PopulateOptions } from "mongoose";

export class ChatRepository extends DatabaseRepository<IChat> {
  constructor() {
    super(ChatModel);
  }

  async findOneChat({
    filter,
    projection,
    options,
    page,
    size,
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: (QueryOptions<IChat> & { lean?: false }) | null | undefined;
    page?: string | undefined;
    size?: string | undefined;
  }): Promise<HydratedDocument<IChat> | null>;
  async findOneChat({
    filter,
    projection,
    options,
    page,
    size,
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: (QueryOptions<IChat> & { lean?: true }) | null | undefined;
    page?: string | undefined;
    size?: string | undefined;
  }): Promise<FlattenMaps<IChat> | null>;

  async findOneChat({
    filter,
    projection,
    options,
    page = "1",
    size = "5",
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: QueryOptions<IChat> | null | undefined;
    page?: string | number | undefined ;
    size?: string | number | undefined ;
  }): Promise<HydratedDocument<IChat> | FlattenMaps<IChat> | null> {
    const pageNum = Number(page);
    const sizeNum = Number(size);
    const doc = this.model.findOne(filter, {
      ...((projection as Record<string, any>) || {}),
      messages: {
        $slice: [-(pageNum * sizeNum), sizeNum],
      },
    });
    if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
    if (options?.lean) doc.lean(options.lean);
    return await doc.exec();
  }
}
