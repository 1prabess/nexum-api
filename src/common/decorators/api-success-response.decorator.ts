import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

export function ApiSuccessResponse<T extends Type<any>>(
  model: T,
  options?: { isArray?: boolean; message?: string },
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: options?.message || 'Request successful',
      schema: {
        allOf: [
          {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'success' },
              message: {
                type: 'string',
                example: options?.message || 'Request successful',
              },
              data: options?.isArray
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  }
                : { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
}
