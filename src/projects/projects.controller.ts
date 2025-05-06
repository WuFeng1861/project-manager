import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RestartProjectDto } from './dto/restart-project.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Register or update project information' })
  @ApiResponse({ status: 201, description: 'Project information saved successfully' })
  async createOrUpdate(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.createOrUpdate(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects information' })
  @ApiResponse({ status: 200, description: 'Returns all projects information' })
  @ApiQuery({ name: 'adminPassword', required: false, description: 'Admin password for full access' })
  async findAll(@Query('adminPassword') adminPassword: string) {
    const isAdmin = adminPassword === 'wufeng1998';
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

  @Get(':serviceName')
  @ApiOperation({ summary: 'Get a specific project information' })
  @ApiResponse({ status: 200, description: 'Returns the project information' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiQuery({ name: 'adminPassword', required: false, description: 'Admin password for full access' })
  async findOne(
    @Param('serviceName') serviceName: string,
    @Query('adminPassword') adminPassword: string,
  ) {
    const isAdmin = adminPassword === 'wufeng1998';
    const project = await this.projectsService.findOne(serviceName, isAdmin);
    
    if (!project) {
      throw new NotFoundException(`Project with service name ${serviceName} not found`);
    }
    
    return project;
  }
}