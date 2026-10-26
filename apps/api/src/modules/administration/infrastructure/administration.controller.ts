import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, Pagination, QueryPagination } from '../../framework/pagination';
import { AuthedUser, HasRole } from '../../simple-auth';
import { AdministrationService } from '../administration.service';

import { AdministrationErrorMapper } from './administration.filter';
import {
  CreatedUserDto,
  CreateUserDto,
  ListUsersQueryDto,
  UpdateUserDisplayTitleDto,
  UpdateUserEmailDto,
  UpdateUserPasswordDto,
  UpdateUserRoleDto,
} from './dto/administration.dto';
import { DetailedAdminUserDto } from './queries/details-user.query';
import { ListedTitleHoldersDto } from './queries/list-title-holders.query';
import { PaginatedAdminUserListItemDto } from './queries/list-users.query';

@Controller('/api/administration/v1')
@UseInterceptors(AdministrationErrorMapper)
export class AdministrationController {
  constructor(private readonly administration: AdministrationService) {}

  @HasRole('ADMIN')
  @Get('/users')
  @ApiPaginated()
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.OK, type: PaginatedAdminUserListItemDto })
  listUsers(
    @QueryPagination() pagination: Pagination,
    @Query() query: ListUsersQueryDto,
  ): Promise<PaginatedAdminUserListItemDto> {
    return this.administration.listUsers({
      pagination,
      roles: query.roles,
      search: query.search,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      statuses: query.statuses,
    });
  }

  @HasRole('ADMIN')
  @Post('/users')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.CREATED, type: CreatedUserDto })
  createUser(@AuthedUser() actor: { id: string }, @Body() body: CreateUserDto): Promise<CreatedUserDto> {
    return this.administration.createUser({ ...body, actorId: actor.id });
  }

  @HasRole('ADMIN')
  @Get('/users/:userId')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedAdminUserDto })
  detailsUser(
    @AuthedUser() actor: { id: string },
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<DetailedAdminUserDto> {
    return this.administration.detailsUser({ actorId: actor.id, userId });
  }

  @HasRole('ADMIN')
  @Get('/title-holders')
  @ZodResponse({ status: HttpStatus.OK, type: ListedTitleHoldersDto })
  listTitleHolders(): Promise<ListedTitleHoldersDto> {
    return this.administration.listTitleHolders();
  }

  @HasRole('ADMIN')
  @Put('/users/:userId/email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updateEmail(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() { email }: UpdateUserEmailDto,
  ): Promise<void> {
    return this.administration.updateEmail({ email, userId });
  }

  @HasRole('ADMIN')
  @Put('/users/:userId/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updatePassword(
    @AuthedUser() actor: { sessionId: string },
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() { password }: UpdateUserPasswordDto,
  ): Promise<void> {
    return this.administration.updatePassword({ actorSessionId: actor.sessionId, password, userId });
  }

  @HasRole('ADMIN')
  @Put('/users/:userId/role')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updateRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() { role }: UpdateUserRoleDto,
  ): Promise<void> {
    return this.administration.updateRole({ role, userId });
  }

  @HasRole('ADMIN')
  @Put('/users/:userId/display-title')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updateDisplayTitle(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() { displayTitle }: UpdateUserDisplayTitleDto,
  ): Promise<void> {
    return this.administration.updateDisplayTitle({ displayTitle, userId });
  }

  @HasRole('ADMIN')
  @Put('/users/:userId/promotion')
  @HttpCode(HttpStatus.NO_CONTENT)
  promoteToAdmin(
    @AuthedUser() actor: { id: string },
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.administration.promoteToAdmin({ actorId: actor.id, userId });
  }

  @HasRole('ADMIN')
  @Delete('/users/:userId/promotion')
  @HttpCode(HttpStatus.NO_CONTENT)
  demoteFromAdmin(
    @AuthedUser() actor: { id: string },
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.administration.demoteFromAdmin({ actorId: actor.id, userId });
  }

  @HasRole('ADMIN')
  @Put('/users/:userId/deactivation')
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(
    @AuthedUser() actor: { id: string },
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.administration.deactivate({ actorId: actor.id, userId });
  }

  @HasRole('ADMIN')
  @Delete('/users/:userId/deactivation')
  @HttpCode(HttpStatus.NO_CONTENT)
  reactivate(
    @AuthedUser() actor: { id: string },
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.administration.reactivate({ actorId: actor.id, userId });
  }
}
