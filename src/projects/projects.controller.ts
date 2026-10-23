import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException, BadRequestException, Delete
} from '@nestjs/common';
import { isIP } from 'node:net';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RestartProjectDto } from './dto/restart-project.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { ClientIpUtil } from '../common/utils/client-ip.util';
import { IpBlockService } from '../rate-limit/ip-block.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly ipBlockService: IpBlockService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register or update project information' })
  @ApiResponse({ status: 201, description: 'Project information saved successfully' })
  async createOrUpdate(
    @Body() createProjectDto: CreateProjectDto,
    @Req() request: ExpressRequest,
  ) {
    return this.projectsService.createOrUpdate(
      createProjectDto,
      ClientIpUtil.getClientIp(request),
      ClientIpUtil.getRequestIps(request),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects information' })
  @ApiResponse({ status: 200, description: 'Returns all projects information' })
  @ApiQuery({ name: 'adminPassword', required: false, description: 'Admin password for full access' })
  async findAll(@Query('adminPassword') adminPassword: string) {
    const isAdmin = adminPassword === process.env.SERVER_PASSWORD;
    return this.projectsService.findAll(isAdmin);
  }

  @Get('blocked-ips')
  @ApiOperation({ summary: '获取黑名单中的 IP（仅管理员）' })
  @ApiResponse({ status: 200, description: '返回当前生效的黑名单' })
  @UseGuards(AdminAuthGuard)
  async listBlockedIps() {
    return this.ipBlockService.list();
  }

  @Post('blocked-ips')
  @ApiOperation({ summary: '手动将 IP 加入黑名单（仅管理员）' })
  @ApiResponse({ status: 201, description: 'IP 已加入黑名单' })
  @UseGuards(AdminAuthGuard)
  async blockIp(
    @Body()
    body: { ip?: string; durationHours?: number; reason?: string },
  ) {
    const ip = (body?.ip || '').trim();
    if (!ip || !isIP(ip)) {
      throw new BadRequestException('IP 格式不正确');
    }

    const defaultMs = Number(process.env.RATE_LIMIT_BLOCK_MS) || 24 * 60 * 60 * 1000;
    const durationHours = Number(body?.durationHours);
    const durationMs =
      durationHours > 0 ? durationHours * 60 * 60 * 1000 : defaultMs;

    await this.ipBlockService.block(
      ip,
      durationMs,
      body?.reason?.trim() || '管理员手动加入黑名单',
    );

    return {
      success: true,
      message: `已将 ${ip} 加入黑名单`,
      ip,
      blockedUntil: new Date(Date.now() + durationMs),
    };
  }

  @Delete('blocked-ips/:ip')
  @ApiOperation({ summary: '解除指定 IP 的黑名单（仅管理员）' })
  @ApiResponse({ status: 200, description: '黑名单已解除' })
  @UseGuards(AdminAuthGuard)
  async unblockIp(@Param('ip') ip: string) {
    return this.ipBlockService.unblock(ip);
  }

  @Post('restart')
  @ApiOperation({ summary: 'Restart a project service' })
  @ApiResponse({ status: 200, description: 'Project service restarted successfully' })
  @UseGuards(AdminAuthGuard)
  async restartProject(@Body() restartProjectDto: RestartProjectDto) {
    try {
      return await this.projectsService.restartProject(restartProjectDto.serviceName);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to restart the service');
    }
  }

  @Get('pause')
  @ApiOperation({ summary: '暂停某个项目指定时长内的邮件通知' })
  @ApiResponse({ status: 200, description: '暂停成功' })
  @ApiQuery({ name: 'projectName', required: true, description: '项目服务名' })
  @ApiQuery({ name: 'time', required: true, description: '暂停时长（小时）' })
  async pauseProject(
    @Query('projectName') projectName: string,
    @Query('time') time: string,
  ) {
    const hours = Number(time);
    if (!projectName || !hours || hours <= 0) {
      throw new BadRequestException('projectName 和 time(正数) 参数必填');
    }
    return this.projectsService.pauseProject(projectName, hours);
  }

  @Get(':serviceName')
  @ApiOperation({ summary: 'Get a specific project information' })
  @ApiResponse({ status: 200, description: 'Returns the project information' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiQuery({ name: 'adminPassword', required: false, description: 'Admin password for full access' })
  async findOne(
    @Param('serviceName') serviceName: string,
    @Query('adminPassword') adminPassword: string,
  ) {
    const isAdmin = adminPassword === process.env.SERVER_PASSWORD;
    const project = await this.projectsService.findOne(serviceName, isAdmin);
    
    if (!project) {
      throw new NotFoundException(`Project with service name ${serviceName} not found`);
    }
    
    return project;
  }
  
  @Delete(':serviceName/ip-history')
  @ApiOperation({ summary: '清空项目的 IP 记录（仅管理员）' })
  @ApiResponse({ status: 200, description: 'IP 记录已清空' })
  @UseGuards(AdminAuthGuard)
  async clearSourceIps(@Param('serviceName') serviceName: string) {
    return this.projectsService.clearSourceIps(serviceName);
  }

  @Delete()
  @ApiOperation({ summary: '删除一个或多个项目' })
  @ApiResponse({ status: 200, description: '项目删除成功' })
  @UseGuards(AdminAuthGuard)
  async deleteProjects(@Body() serviceNames: string[]) {
    return this.projectsService.deleteProjects(serviceNames);
  }
}
