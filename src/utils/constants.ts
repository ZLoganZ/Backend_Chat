export const selectUser = '_id name email image alias posts followers following';
export const selectUserArr = ['_id', 'name', 'image', 'bio', 'alias', 'posts', 'followers', 'following'];
export const selectUserPopulate = '_id name email image alias';
export const selectUserPopulateArr = ['_id', 'name', 'image', 'alias'];
export const selectUserPopulateObj = {
  _id: 1,
  name: 1,
  image: 1,
  alias: 1
};
export const selectPost = '_id content image creator likes saves tags location createdAt';
export const selectPostArr = [
  '_id',
  'content',
  'image',
  'creator',
  'likes',
  'saves',
  'tags',
  'location',
  'createdAt'
];
export const selectPostObj = {
  _id: 1,
  content: 1,
  creator: 1,
  likes: 1,
  saves: 1,
  tags: 1,
  image: 1,
  location: 1,
  createdAt: 1
};
