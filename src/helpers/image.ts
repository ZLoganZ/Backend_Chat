import cloudinary from 'cloudinary';

const uploadImage = cloudinary.v2;
uploadImage.config({
  secure: true
});

export default uploadImage.uploader;
