import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // ------------------ HEALTH CHECK ------------------
  @Get('/healthcheck')
  healthCheck(): { status: string } {
    return { status: 'ok' };
  }
}
