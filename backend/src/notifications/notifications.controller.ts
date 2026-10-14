import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { CurrentUser, UserId } from '../common/decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { toPaginated } from '../common/utils/pagination.util';
import { NotificationsService } from './notifications.service';

export class NotificationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ name: 'unread', required: false, type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  unread?: boolean;
}

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@ApiCookieAuth('grx_access_token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  async list(@UserId() userId: string, @Query() query: NotificationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { items, total } = await this.notifications.list(
      userId,
      page,
      limit,
      query.unread === true,
    );
    const result = toPaginated(items, total, query);
    return { data: result.items, pagination: result.pagination, message: 'Notifications' };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count' })
  @ApiOkResponse({ schema: { example: { count: 3 } } })
  async unreadCount(@UserId() userId: string) {
    return { data: { count: await this.notifications.countUnread(userId) } };
  }

  @Get('unread')
  @ApiOperation({ summary: 'Alias of `?unread=true` used by the nav badge poller' })
  async unread(@UserId() userId: string) {
    const count = await this.notifications.countUnread(userId);
    return { data: { count } };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark every notification as read' })
  async markAllRead(@UserId() userId: string) {
    const updated = await this.notifications.markAllRead(userId);
    return { data: { updated }, message: `${updated} notification(s) marked as read` };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  async markRead(@UserId() userId: string, @Param('id') id: string) {
    const updated = await this.notifications.markRead(userId, id);
    return {
      data: { updated },
      message: updated ? 'Marked as read' : 'Notification not found',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete one notification' })
  @HttpCode(HttpStatus.OK)
  async remove(@UserId() userId: string, @Param('id') id: string) {
    const removed = await this.notifications.remove(userId, id);
    return {
      data: { removed },
      message: removed ? 'Notification deleted' : 'Notification not found',
    };
  }
}
