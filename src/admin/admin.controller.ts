import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AdminService } from './admin.service';
import { IpWhitelistService } from './ip-whitelist.service';
import { IpBlockService } from '../rate-limit/ip-block.service';
import { AdminTokenGuard } from './guards/admin-token.guard';
import { ClientIpUtil } from '../common/utils/client-ip.util';
import {
  AddWhitelistDto,
  BlockIpDto,
  ChangeCredentialsDto,
  LoginDto,
  SetupAdminDto,
} from './dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly whitelistService: IpWhitelistService,
    private readonly ipBlockService: IpBlockService,
  ) {}

  // ------------------------------------------------------------------
  // 公开接口：初始化状态 / 首次初始化 / 登录
  // ------------------------------------------------------------------

  @Get('status')
  @ApiOperation({ summary: '查询管理员账号是否已初始化（前端判断是否弹首次设置）' })
  async status() {
    return this.adminService.getStatus();
  }

  @Post('setup')
  @ApiOperation({ summary: '首次设置管理员账号密码（仅未初始化时可用）' })
  @ApiResponse({ status: 201, description: '初始化成功并直接登录' })
  async setup(@Body() dto: SetupAdminDto, @Req() request: ExpressRequest) {
    return this.adminService.setup(dto.username, dto.password, this.meta(request));
  }

  @Post('login')
  @ApiOperation({ summary: '管理员账号 + 密码登录' })
  @ApiResponse({ status: 201, description: '登录成功，返回令牌' })
  async login(@Body() dto: LoginDto, @Req() request: ExpressRequest) {
    return this.adminService.login(dto.username, dto.password, this.meta(request));
  }

  // ------------------------------------------------------------------
  // 需要管理员令牌
  // ------------------------------------------------------------------

  @Post('logout')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '退出登录（销毁当前会话）' })
  async logout(@Req() request: ExpressRequest) {
    const token = AdminService.extractToken(request);
    return this.adminService.logout(token);
  }

  @Get('profile')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '获取当前登录管理员信息' })
  async profile() {
    return this.adminService.getProfile();
  }

  @Put('credentials')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '修改管理员账号/密码（需当前密码确认）' })
  @ApiResponse({ status: 200, description: '修改成功' })
  async changeCredentials(
    @Body() dto: ChangeCredentialsDto,
    @Req() request: ExpressRequest,
  ) {
    const admin = (request as any).admin as { sessionId: number };
    return this.adminService.changeCredentials(
      admin.sessionId,
      dto.currentPassword,
      dto.username,
      dto.newPassword,
    );
  }

  // ------------------------------------------------------------------
  // 黑名单
  // ------------------------------------------------------------------

  @Get('blocked-ips')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '获取黑名单 IP 列表' })
  async listBlockedIps() {
    return this.ipBlockService.list();
  }

  @Post('blocked-ips')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '手动将 IP 加入黑名单' })
  async blockIp(@Body() dto: BlockIpDto) {
    const ip = this.whitelistService.normalizeIp(dto.ip);
    if (!ip) {
      throw new BadRequestException('IP 格式不正确');
    }

    if (this.whitelistService.isWhitelisted(ip)) {
      throw new BadRequestException(
        `IP ${ip} 当前在白名单中，请先将其移出白名单再拉黑`,
      );
    }

    const defaultMs = Number(process.env.RATE_LIMIT_BLOCK_MS) || 24 * 60 * 60 * 1000;
    const hours = Number(dto.durationHours);
    const durationMs = hours > 0 ? hours * 60 * 60 * 1000 : defaultMs;

    await this.ipBlockService.block(
      ip,
      durationMs,
      dto.reason?.trim() || '管理员手动加入黑名单',
    );

    return {
      success: true,
      message: `已将 ${ip} 加入黑名单`,
      ip,
      blockedUntil: new Date(Date.now() + durationMs),
    };
  }

  @Delete('blocked-ips/:ip')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '解除指定 IP 的黑名单' })
  async unblockIp(@Param('ip') ip: string) {
    const normalized = this.whitelistService.normalizeIp(ip);
    if (!normalized) {
      throw new BadRequestException('IP 格式不正确');
    }
    return this.ipBlockService.unblock(normalized);
  }

  // ------------------------------------------------------------------
  // 白名单
  // ------------------------------------------------------------------

  @Get('whitelist')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '获取上报 IP 白名单' })
  async listWhitelist() {
    return this.whitelistService.list();
  }

  @Post('whitelist')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '将 IP 加入白名单（若在黑名单中会同时解除）' })
  @ApiResponse({ status: 201, description: '已加入白名单' })
  async addWhitelist(
    @Body() dto: AddWhitelistDto,
    @Req() request: ExpressRequest,
  ) {
    const admin = (request as any).admin as { username: string };

    try {
      const result = await this.whitelistService.add(
        dto.ip,
        dto.note,
        admin?.username || 'admin',
      );

      return {
        success: true,
        message: result.unblocked
          ? `${result.entry.ip} 已加入白名单，并已解除黑名单`
          : `${result.entry.ip} 已加入白名单`,
        data: result.entry,
        created: result.created,
        unblocked: result.unblocked,
      };
    } catch (error) {
      throw new BadRequestException(error.message || '加入白名单失败');
    }
  }

  @Delete('whitelist/:ip')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '将 IP 移出白名单' })
  async removeWhitelist(@Param('ip') ip: string) {
    const normalized = this.whitelistService.normalizeIp(ip);
    if (!normalized) {
      throw new BadRequestException('IP 格式不正确');
    }
    return this.whitelistService.remove(normalized);
  }

  private meta(request: ExpressRequest) {
    return {
      ip: ClientIpUtil.getTrustedClientIp(request) || 'unknown',
      userAgent: String(request.headers['user-agent'] || ''),
    };
  }
}
