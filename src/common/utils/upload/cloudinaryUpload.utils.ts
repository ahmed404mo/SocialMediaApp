import cloudinary from "../../../DB/cloudinary/cloudinary.db"; 



export const uploadSingleToCloudinary = async (file: Express.Multer.File, folderPath: string): Promise<string> => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: folderPath,
  });
  return result.secure_url;
};



export const uploadMultipleToCloudinary = async (files: Express.Multer.File[], folderPath: string): Promise<string[]> => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map((file) =>
    cloudinary.uploader.upload(file.path, {
      folder: folderPath,
    })
  );

  const uploadResults = await Promise.all(uploadPromises);
  return uploadResults.map((result) => result.secure_url);
};