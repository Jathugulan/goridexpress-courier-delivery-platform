import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Audit, CurrentUser, RequiresPermissions, Roles, UserId } from '../common/decorators';
import { AuditAction, Permission, Role } from '../common/enums';
import type { AuthUser, RequestContext } from '../common/types';
import { CustomersService } from './customers.service';
import {
  AdminCustomerUpdateDto,
  BlockCustomerDto,
  CustomerQueryDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from './dto/customer.dto';

@ApiTags('customers')
@ApiBearerAuth('access-token')
@ApiCookieAuth('grx_access_token')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  /* ----------------------------- Self service --------------------------- */

  @Get('me')
  @ApiOperation({ summary: 'Current customer profile' })
  async me(@UserId() userId: string) {
    return { data: await this.customers.getProfile(userId) };
  }

  @Put('me')
  @ApiOperation({ summary: 'Update the current customer profile' })
  @Audit(AuditAction.CUSTOMER_UPDATED, 'customer')
  async updateMe(
    @UserId() userId: string,
    @Body() dto: UpdateProfileDto,
    @Req() request: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return { data: await this.customers.updateProfile(userId, dto, this.context(request, user)) };
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Notification and locale preferences' })
  async preferences(@UserId() userId: string) {
    const profile = await this.customers.getProfile(userId);
    return { data: { preferences: profile.preferences } };
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update notification and locale preferences' })
  async updatePreferences(@UserId() userId: string, @Body() dto: UpdatePreferencesDto) {
    return { data: await this.customers.updatePreferences(userId, dto) };
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Customer dashboard',
    description: 'Aggregate payload for the dashboard screen in a single round trip.',
  })
  async dashboard(@UserId() userId: string) {
    return { data: await this.customers.dashboard(userId) };
  }

  /* -------------------------------- Admin ------------------------------- */

  @Get()
  @Roles(Role.ADMIN)
  @RequiresPermissions(Permission.MANAGE_CUSTOMERS)
  @ApiOperation({ summary: 'List customers (admin)' })
  async list(@Query() query: CustomerQueryDto) {
    const result = await this.customers.list(query);
    return { data: result.items, pagination: result.pagination, message: 'Customers' };
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Customer detail (admin)' })
  async adminGet(@Param('id') id: string) {
    return { data: await this.customers.adminGet(id) };
  }

  @Patch(':id/block')
  @Roles(Role.ADMIN)
  @Audit(AuditAction.CUSTOMER_BLOCKED, 'customer')
  @ApiOperation({ summary: 'Block a customer and deactivate their login' })
  async block(
    @Param('id') id: string,
    @Body() dto: BlockCustomerDto,
    @Req() request: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      data: await this.customers.block(id, dto, this.context(request, user)),
      message: 'Customer blocked',
    };
  }

  @Patch(':id/unblock')
  @Roles(Role.ADMIN)
  @Audit(AuditAction.CUSTOMER_UNBLOCKED, 'customer')
  @ApiOperation({ summary: 'Unblock a customer and reactivate their login' })
  async unblock(
    @Param('id') id: string,
    @Req() request: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      data: await this.customers.unblock(id, this.context(request, user)),
      message: 'Customer unblocked',
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin edit of a customer record' })
  async adminUpdate(
    @Param('id') id: string,
    @Body() dto: AdminCustomerUpdateDto,
    @Req() request: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      data: await this.customers.adminUpdate(
        id,
        dto as unknown as Record<string, unknown>,
        this.context(request, user),
      ),
      message: 'Customer updated',
    };
  }

  @Get(':id/orders')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Order history for a customer (admin)' })
  async customerOrders(@Param('id') id: string) {
    return { data: await this.customers.customerOrders(id) };
  }

  @Get(':id/payments')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Payments for a customer (admin)' })
  async customerPayments(@Param('id') id: string) {
    return { data: await this.customers.customerPayments(id) };
  }

  @Get(':id/tickets')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Support tickets for a customer (admin)' })
  async customerTickets(@Param('id') id: string) {
    return { data: await this.customers.customerTickets(id) };
  }

  private context(request: Request, user: AuthUser): RequestContext {
    return {
      ip: (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? request.ip,
      userAgent: request.headers['user-agent'],
      userId: user.id,
      role: user.role,
    };
  }
}
