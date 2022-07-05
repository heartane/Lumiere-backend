import jwtManager from '../../infrastructure/setup/security/jwtTokenManager.js';

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
    token: jwtManager.encode({ id: user._id, isAdmin: user.isAdmin }),
  };
}

export function serializePagination(data, page, count, pageSize) {
  const key = Object.keys(data)[0];

  /* 
  주던 응답 형태를 변경하지 않기 위해,
  다음부터는 꼭 응답을 정형화하자.
  
  res.json({users: [{...}], page: 1, pages: 2}) (x)
  res.json({data: [{...}], page: 1, pages: 2}) (o)
  */
  return {
    [key]: data[key],
    page,
    pages: Math.ceil(count / pageSize) || 1,
  };
}
