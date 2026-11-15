import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { RestartProjectDto } from './dto/restart-project.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { UploadWhitelistGuard } from '../admin/guards/upload-whitelist.guard';
import { AdminService } from '../admin/admin.service';
import { ClientIpUtil } from '../common/utils/client-ip.util';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly adminService: AdminService,
  ) {}

  @Post()
  @UseGuards(UploadWhitelistGuard)
  @ApiOperation({ summary: 'Register or update project information' })
  @ApiResponse({ status: 201, description: 'Project information saved successfully' })
  @ApiResponse({ status: 403, description: '来源 IP 不在白名单内，已拦截并加入黑名单' })
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
  @ApiQuery({
    name: 'adminPassword',
    required: false,
    deprecated: true,
    description: '已废弃，请改用 Authorization: Bearer <token>',
  })
  async findAll(
    @Req() request: ExpressRequest,
    @Query('adminPassword') _adminPassword?: string,
  ) {
    const isAdmin = await this.checkAdmin(request);
    return this.projectsService.findAll(isAdmin);
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
  @ApiQuery({
    name: 'adminPassword',
    required: false,
    deprecated: true,
    description: '已废弃，请改用 Authorization: Bearer <token>',
  })
  async findOne(
    @Param('serviceName') serviceName: string,
    @Req() request: ExpressRequest,
    @Query('adminPassword') _adminPassword?: string,
  ) {
    const isAdmin = await this.checkAdmin(request);
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

  /** 依据 Bearer 令牌判断是否为管理员（决定是否脱敏服务器 IP） */
  private async checkAdmin(request: ExpressRequest): Promise<boolean> {
    const token = AdminService.extractToken(request);
    if (!token) {
      return false;
    }
    return !!(await this.adminService.validateSession(token));
  }
}
