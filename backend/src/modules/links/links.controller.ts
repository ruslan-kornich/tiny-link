import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLinkDto, createLinkSchema } from './dto/create-link.dto';
import { ListLinksDto, listLinksSchema } from './dto/list-links.dto';
import { LinksService } from './links.service';

@Controller('api/links')
@UseGuards(JwtAuthGuard)
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createLinkSchema)) dto: CreateLinkDto,
  ) {
    return this.linksService.create(user.userId, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listLinksSchema)) query: ListLinksDto,
  ) {
    return this.linksService.list(user.userId, query);
  }

  @Get(':code')
  getByCode(@CurrentUser() user: AuthenticatedUser, @Param('code') code: string) {
    return this.linksService.getByCode(user.userId, code);
  }

  @Post(':code/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param('code') code: string) {
    return this.linksService.deactivate(user.userId, code);
  }
}
