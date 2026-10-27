import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { optionalEnv } from '../config/env';

const DEFAULT_EXPIRE_SECONDS = 60 * 24 * 60 * 60;
const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,32}$/;

@Injectable()
export class ImService {
  generateUserSig(userId: string) {
    if (!USER_ID_PATTERN.test(userId)) {
      throw new UnauthorizedException('当前用户 ID 不符合腾讯 IM UserID 格式');
    }

    const sdkAppId = Number(process.env.TENCENT_IM_SDK_APP_ID);
    const secretKey = process.env.TENCENT_IM_SECRET_KEY?.trim();
    if (!Number.isSafeInteger(sdkAppId) || sdkAppId <= 0 || !secretKey) {
      throw new ServiceUnavailableException(
        '腾讯 IM UserSig 尚未完成服务端配置',
      );
    }

    const expireSeconds = Number(
      optionalEnv(
        'TENCENT_IM_USERSIG_EXPIRE_SECONDS',
        String(DEFAULT_EXPIRE_SECONDS),
      ),
    );
    if (!Number.isSafeInteger(expireSeconds) || expireSeconds < 86400) {
      throw new ServiceUnavailableException(
        'TENCENT_IM_USERSIG_EXPIRE_SECONDS 必须是至少 86400 秒的整数',
      );
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const contentToBeSigned =
      `TLS.identifier:${userId}\n` +
      `TLS.sdkappid:${sdkAppId}\n` +
      `TLS.time:${issuedAt}\n` +
      `TLS.expire:${expireSeconds}\n`;
    const sig = createHmac('sha256', secretKey)
      .update(contentToBeSigned)
      .digest('base64');
    const sigDocument = {
      'TLS.ver': '2.0',
      'TLS.identifier': userId,
      'TLS.sdkappid': sdkAppId,
      'TLS.time': issuedAt,
      'TLS.expire': expireSeconds,
      'TLS.sig': sig,
    };
    const userSig = deflateSync(Buffer.from(JSON.stringify(sigDocument)))
      .toString('base64')
      .replace(/\+/g, '*')
      .replace(/\//g, '-')
      .replace(/=/g, '_');

    return {
      sdkAppId,
      userId,
      userSig,
      expireAt: issuedAt + expireSeconds,
    };
  }
}
