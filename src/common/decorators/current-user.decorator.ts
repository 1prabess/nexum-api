import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { User } from 'src/user/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof any | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request & User>();

    const user = request.user;

    return data ? user?.[data] : user;
  },
);
