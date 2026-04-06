import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/dtos/pagination.dto';

export function ApiSuccessResponse<T extends Type<any>>(
  model: T | null = null,
  options: {
    isArray?: boolean;
    message?: string;
    description?: string;
    noData?: boolean;

    paginatedItemsType?: Type<any>;
  } = {},
) {
  const description =
    options.description || options.message || 'Request successful';

  const isPaginated =
    options.paginatedItemsType != null &&
    model != null &&
    model.name?.includes('Paginated');

  return applyDecorators(
    ...(model ? [ApiExtraModels(model)] : []),
    ...(options.paginatedItemsType
      ? [ApiExtraModels(options.paginatedItemsType)]
      : []),
    ...(isPaginated ? [ApiExtraModels(PaginatedResponseDto)] : []),

    ApiOkResponse({
      description,
      schema: {
        allOf: [
          ...(isPaginated && options.paginatedItemsType
            ? [
                { $ref: getSchemaPath(PaginatedResponseDto) },

                {
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: getSchemaPath(options.paginatedItemsType),
                      },
                    },
                  },
                },
              ]
            : [
                // Non-paginated fallback
                {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: description },
                    ...(options.noData || !model
                      ? {}
                      : {
                          data: options.isArray
                            ? {
                                type: 'array',
                                items: { $ref: getSchemaPath(model) },
                              }
                            : { $ref: getSchemaPath(model) },
                        }),
                  },
                  required: ['status', 'message'],
                },
              ]),
        ],
      },
    }),
  );
}
