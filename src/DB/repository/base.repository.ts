import {
  AnyKeys,
  CreateOptions,
  HydratedDocument,
  Model,
  ProjectionType,
  QueryOptions,
  QueryFilter,
  FlattenMaps,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateResult,
  DeleteResult,
  ReturnsNewDoc,
  PopulateOptions,
} from "mongoose";
import { IPaginate,  } from "../../common/interfaces";

export abstract class DatabaseRepository<TRowDoc> {
  constructor(protected readonly model: Model<TRowDoc>) {}

  async create({
    data,
  }: {
    data: AnyKeys<TRowDoc>;
  }): Promise<HydratedDocument<TRowDoc>>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRowDoc>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRowDoc>[]>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRowDoc>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRowDoc>[] | HydratedDocument<TRowDoc>> {
    return await this.model.create(data as any, options);
  }

  async createOne({
    data,
    options,
  }: {
    data: AnyKeys<TRowDoc>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRowDoc>> {
    const [doc] = (await this.create({ data: [data], options })) || [];
    return doc as HydratedDocument<TRowDoc>;
  }
  // insert many
  async insertMany({
    data,
    // options,
  }: {
    data: AnyKeys<TRowDoc>;
  }): Promise<HydratedDocument<TRowDoc>[]> {
    return (await this.model.insertMany(
      data as any,
    )) as HydratedDocument<TRowDoc>[];
  }

  // Finders
  async findOne({
    filter,
    options,
    projection,
  }: {
    filter?: QueryFilter<TRowDoc>;
    projection?: ProjectionType<TRowDoc> | null | undefined;
    options?: (QueryOptions<TRowDoc> & { lean?: false }) | null | undefined;
  }): Promise<HydratedDocument<TRowDoc> | null>;

  async findOne({
    filter,
    options,
    projection,
  }: {
    filter?: QueryFilter<TRowDoc>;
    projection?: ProjectionType<TRowDoc> | null | undefined;
    options?: (QueryOptions<TRowDoc> & { lean?: true }) | null | undefined;
  }): Promise<null | FlattenMaps<TRowDoc>>;

  async findOne({
    filter,
    options,
    projection,
  }: {
    filter?: QueryFilter<TRowDoc>;
    projection?: ProjectionType<TRowDoc> | null | undefined;
    options?: QueryOptions<TRowDoc> | null | undefined;
  }): Promise<any> {
    const doc = this.model.findOne(filter, projection);
    if (options?.populate) doc.populate(options.populate as any);
    if (options?.lean) doc.lean(options.lean as any);
    return await doc.exec();
  }

  async find({
    filter,
    options,
    projection,
  }: {
    filter?: QueryFilter<TRowDoc>;
    projection?: ProjectionType<TRowDoc> | null | undefined;
    options?: QueryOptions<TRowDoc> | null | undefined;
  }): Promise<HydratedDocument<TRowDoc>[]> {
    const doc = this.model.find(filter, projection);
    if (options?.populate) doc.populate(options.populate as any);
    if (options?.lean) doc.lean(options.lean as any);
    if (options?.skip) doc.skip(options.skip as any);
    if (options?.limit) doc.limit(options.limit as any);
    return await doc.exec();
  }

async paginate({
    filter,
    options={},
    projection,
    page=0,
    size=5
  }: {
    filter?: QueryFilter<TRowDoc>;
    projection?: ProjectionType<TRowDoc> | null | undefined;
    options?: QueryOptions<TRowDoc> | null | undefined;
     page?:number | string | undefined,
    size?:number | string | undefined  
  }): Promise<IPaginate<TRowDoc>> {
    let count:number = -1
if (Number(page)>0) {
  options = options || {}
  page = parseInt(page as string)
  size = parseInt(size as string)
  options.skip = (page - 1 ) * size 
  options.limit = size
  count = await this.model.countDocuments(filter || {})

}
const docs = await this.find({ filter: filter || {}, projection, options })
return {
  docs,
  ...(Number(page) > 0 ? { currentPage: page, size, pages: Math.ceil(count / parseInt(size as string)) } : {})
}
  }
  // Find by id
  async findById({
    _id,
    options,
    projection,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRowDoc> | null | undefined;
    options?: (QueryOptions<TRowDoc> & { lean: false }) | null | undefined;
  }): Promise<HydratedDocument<TRowDoc> | null>;

  async findById({
    _id,
    options,
    projection,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRowDoc> | null | undefined;
    options?: (QueryOptions<TRowDoc> & { lean: true }) | null | undefined;
  }): Promise<null | FlattenMaps<TRowDoc>>;

  async findById({
    _id,
    options,
    projection,
  }: {
    _id?: string | Types.ObjectId;
    projection?: ProjectionType<TRowDoc> | null | undefined;
    options?: QueryOptions<TRowDoc> | null | undefined;
  }): Promise<any> {
    const doc = this.model.findById(_id, projection);
    if (options?.populate) doc.populate(options.populate as any);
    if (options?.lean) doc.lean(options.lean as any);
    return await doc.exec();
  }

  // update
  async findOneAndUpdate({
    filter,
    update,
    options = { new: true },
    populate=[]
  }: {
    filter: QueryFilter<TRowDoc>;
    update: UpdateQuery<TRowDoc> | UpdateWithAggregationPipeline;
    options?: QueryOptions<TRowDoc> & ReturnsNewDoc;
    populate?:PopulateOptions[]
  }): Promise<HydratedDocument<TRowDoc> | null> {
    if (Array.isArray(update)) {
      update.push({$set:{__v:{$add:["$__v",1]}}})
      return await this.model.findOneAndUpdate(
        filter,
        update,
        options,
      ).populate(populate);
    }
    return await this.model.findOneAndUpdate(
      filter,
      { ...update, $inc: { __v: 1 } },
      options,
    ).populate(populate);
  }
  async findByIdAndUpdate({
    _id,
    update,
    options = { new: true },
  }: {
    _id: Types.ObjectId | string;
    update: UpdateQuery<TRowDoc>;
    options?: QueryOptions<TRowDoc> & ReturnsNewDoc;
  }): Promise<HydratedDocument<TRowDoc> | null> {
    return await this.model.findByIdAndUpdate(
      _id,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  }
  async updataOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRowDoc>;
    update: UpdateQuery<TRowDoc> | UpdateWithAggregationPipeline;
    options?: QueryOptions<TRowDoc> | null;
  }): Promise<UpdateResult> {
    return await this.model.updateOne(
      filter,
      { ...update, $inc: { __v: 1 } },
      options as any,
    );
  }
  async updataMany({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRowDoc>;
    update: UpdateQuery<TRowDoc> | UpdateWithAggregationPipeline;
    options?: QueryOptions<TRowDoc> | null;
  }): Promise<UpdateResult> {
    return await this.model.updateMany(filter, update as any, options as any);
  }
  // DELETE
  async findOneAndDelete({
    filter,
  }: {
    filter: QueryFilter<TRowDoc>;
  }): Promise<HydratedDocument<TRowDoc> | null> {
    return await this.model.findOneAndDelete(filter);
  }
  async findByIdAndDelete({
    _id,
  }: {
    _id: Types.ObjectId;
  }): Promise<HydratedDocument<TRowDoc> | null> {
    return await this.model.findByIdAndDelete(_id);
  }

  async deleteOne({
    filter,
  }: {
    filter: QueryFilter<TRowDoc>;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter);
  }
  async deleteMany({
    filter,
  }: {
    filter: QueryFilter<TRowDoc>;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter);
  }
}
