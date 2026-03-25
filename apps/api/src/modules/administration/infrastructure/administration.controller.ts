import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';
import { Role } from 'shared-models';
import {
  ApiPaginated,
  Pagination,
  QueryPagination,
} from 'src/modules/framework/pagination';
import { HasRole } from 'src/modules/simple-auth';
import { AdministrationService } from '../administration.service';
import { AdministrationErrorMapper } from './administration.filter';
import {
  ListUsersQueryDto,
  UpdateUserDisplayTitleDto,
  UpdateUserEmailDto,
  UpdateUserPasswordDto,
  UpdateUserRoleDto,
} from './dto/administration.dto';
import { DetailedAdminUserDto } from './queries/details-user.query';
import { PaginatedAdminUserListItemDto } from './queries/list-users.query';

@Controller('/api/administration/v1')
@UseInterceptors(AdministrationErrorMapper)
export class AdministrationController {
  constructor(private readonly administration: AdministrationService) {}

  @HasRole(Role.ADMIN)
  @Get('/users')
  @ApiPaginated()
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: PaginatedAdminUserListItemDto, status: HttpStatus.OK })
  listUsers(
    @QueryPagination() pagination: Pagination,
    @Query() query: ListUsersQueryDto,
  ): Promise<PaginatedAdminUserListItemDto> {
    return this.administration.listUsers({
      pagination,
      search: query.search,
      roles: query.roles,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
    });
  }

  @HasRole(Role.ADMIN)
  @Get('/users/:userId')
  @ZodResponse({ type: DetailedAdminUserDto, status: HttpStatus.OK })
  detailsUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<DetailedAdminUserDto> {
    return this.administration.detailsUser({ userId });
  }

  @HasRole(Role.ADMIN)
  @Put('/users/:userId/email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updateEmail(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() { email }: UpdateUserEmailDto,
  ): Promise<void> {
    return this.administration.updateEmail({ userId, email });
  }

  @HasRole(Role.ADMIN)
  @Put('/users/:userId/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updatePassword(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() { password }: UpdateUserPasswordDto,
  ): Promise<void> {
    return this.administration.updatePassword({ userId, password });
  }

  @HasRole(Role.ADMIN)
  @Put('/users/:userId/role')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updateRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() { role }: UpdateUserRoleDto,
  ): Promise<void> {
    return this.administration.updateTole({ userId, role });
  }

  @HasRole(Role.ADMIN)
  @Put('/users/:userId/display-title')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updateDisplayTitle(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() { displayTitle }: UpdateUserDisplayTitleDto,
  ): Promise<void> {
    return this.administration.updateDisplayTitle({ userId, displayTitle });
  }

  @HasRole(Role.ADMIN)
  @Put('/users/:userId/promotion')
  @HttpCode(HttpStatus.NO_CONTENT)
  promoteToAdmin(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.administration.promoteToAdmin({ userId });
  }

  @HasRole(Role.ADMIN)
  @Delete('/users/:userId/promotion')
  @HttpCode(HttpStatus.NO_CONTENT)
  demoteFromAdmin(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.administration.demoteFromAdmin({ userId });
  }
}
