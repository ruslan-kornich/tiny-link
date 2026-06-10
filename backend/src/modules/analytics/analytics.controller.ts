import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { StatsQueryDto, statsQuerySchema } from './dto/stats-query.dto';

@Controller('api/links')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':code/stats')
  getStats(
    @CurrentUser() user: AuthenticatedUser,
    @Param('code') code: string,
    @Query(new ZodValidationPipe(statsQuerySchema)) query: StatsQueryDto,
  ) {
    return this.analyticsService.getStats(user.userId, code, query);
  }
}
