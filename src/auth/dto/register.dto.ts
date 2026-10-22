import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Gender } from '../../generated/prisma/enums';

export class RegisterDto {
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username 只能包含字母、数字和下划线',
  })
  username: string;

  @IsString()
  @Length(6, 64)
  password: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  nickname?: string;

  @IsOptional()
  @IsIn([Gender.UNKNOWN, Gender.MALE, Gender.FEMALE])
  gender?: Gender;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
