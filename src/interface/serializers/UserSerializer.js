import generateAccessToken from '../../utils/generateToken.js';

/* 
DTO

유저정보 응답이 3번이나 반복이 된다. 따라서 DTO로 빼준다.
추후 데이터가 배열로 들어오는 상황 등 고려하기
*/
export function serializeSingleUserInfo(user) {
  return {
    _id: user._id,
    name: user.name,
    isAdmin: user.isAdmin,
    token: generateAccessToken(user._id, user.isAdmin),
  };
}

export function serializePagination(data, page, count, pageSize) {
  return { data, page, pages: Math.ceil(count / pageSize) };
}
