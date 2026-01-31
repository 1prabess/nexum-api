import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from '../interfaces/response.interface';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE } from '../decorators/response-message.decorator';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) ||
      'Request Successful';

    return next.handle().pipe(
      map((res) => {
        if (
          res &&
          typeof res === 'object' &&
          'data' in res &&
          ('meta' in res || 'links' in res)
        ) {
          return { status: 'success', message, ...res };
        }

        return { status: 'success', message, data: res };
      }),
    );
  }
}
