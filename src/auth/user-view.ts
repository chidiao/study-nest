import { Gender } from '../generated/prisma/enums';

export interface UserEntity {
  id: number;
  username: string;
  nickname: string;
  gender: Gender;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toUserView(user: UserEntity) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    gender: user.gender,
    phone: user.phone,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
