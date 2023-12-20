export const selectUser = '_id name image bio alias posts followers following';
export const selectUserArr = ['_id', 'name', 'image', 'bio', 'alias', 'posts', 'followers', 'following'];
export const selectUserPopulate = '_id name image alias';
export const selectUserPopulateArr = ['_id', 'name', 'image', 'alias'];
export const selectUserPopulateObj = {
  _id: 1,
  name: 1,
  image: 1,
  alias: 1
};
export const selectPost = '_id content image visibility creator likes comments saves tags location createdAt';
export const selectPostArr = [
  '_id',
  'content',
  'image',
  'creator',
  'visibility',
  'likes',
  'comments',
  'saves',
  'tags',
  'location',
  'createdAt'
];
export const selectPostObj = {
  _id: 1,
  content: 1,
  creator: 1,
  visibility: 1,
  likes: 1,
  comments: 1,
  saves: 1,
  tags: 1,
  image: 1,
  location: 1,
  createdAt: 1
};
export enum HEADER {
  CLIENT_ID = 'client-id',
  ACCESSTOKEN = 'access-token',
  REFRESHTOKEN = 'refresh-token',
  GITHUB_TOKEN = 'github-token'
}
export enum REDIS_CACHE {
  POST = 'post',
  RELATED_POSTS = 'related-posts',
  POSTS = 'posts',
  SAVED_POSTS = 'saved-posts',
  LIKED_POSTS = 'liked-posts',
  USER = 'user',
  TOP_CREATORS = 'top-creators',
  TOP_POSTS = 'top-posts'
}
export const CACHE_TIME = 60 * 60;
