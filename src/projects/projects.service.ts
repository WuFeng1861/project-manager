import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { IpMasker } from '../common/utils/ip-masker.util';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private httpService: HttpService,
  ) {}

  async createOrUpdate(createProjectDto: CreateProjectDto): Promise<Project> {
    let project = await this.projectRepository.findOne({
      where: { serviceName: createProjectDto.serviceName },
    });

    if (project) {
      project = this.projectRepository.merge(project, createProjectDto);
    } else {
      project = this.projectRepository.create(createProjectDto);
    }

    const savedProject = await this.projectRepository.save(project);
    
    await this.cacheManager.set(
      `project_${savedProject.serviceName}`,
      savedProject,
      60*60*1000,
    );
    
    await this.cacheManager.del('all_projects');
    
    return savedProject;
  }

  async findAll(isAdmin: boolean): Promise<Project[]> {
    const cacheKey = isAdmin ? 'all_projects_admin' : 'all_projects';
    const cachedProjects = await this.cacheManager.get<Project[]>(cacheKey);
    
    if (cachedProjects) {
      return cachedProjects;
    }
    
    const projects = await this.projectRepository.find();
    
    const processedProjects = projects.map(project => {
      if (!isAdmin) {
        return {
          ...project,
          serverIp: IpMasker.maskIp(project.serverIp),
        };
      }
      return project;
    });
    
    await this.cacheManager.set(
      cacheKey,
      processedProjects,
      60*60*1000,
    );
    
    return processedProjects;
  }

  async findOne(serviceName: string, isAdmin: boolean): Promise<Project> {
    const cacheKey = `project_${serviceName}${isAdmin ? '_admin' : ''}`;
    const cachedProject = await this.cacheManager.get<Project>(cacheKey);
    
    if (cachedProject) {
      return cachedProject;
    }
    
    const project = await this.projectRepository.findOne({
      where: { serviceName },
    });
    
    if (!project) {
      throw new NotFoundException(`Project with service name ${serviceName} not found`);
    }
    
    let processedProject = project;
    if (!isAdmin) {
      processedProject = {
        ...project,
        serverIp: IpMasker.maskIp(project.serverIp),
      };
    }
    
    await this.cacheManager.set(
      cacheKey,
      processedProject,
      60*60*1000,
    );
    
    return processedProject;
  }

  async restartProject(serviceName: string): Promise<{ success: boolean; message: string }> {
    const project = await this.projectRepository.findOne({
      where: { serviceName },
    });
    
    if (!project) {
      throw new NotFoundException(`Project with service name ${serviceName} not found`);
    }
    
    try {
      const url = `http://${project.serverIp}:${project.servicePort}/api/system/restart-p`;
      const response = await firstValueFrom(
        this.httpService.post(url, { password: project.projectPassword })
      );
      
      project.lastRestartTime = new Date();
      await this.projectRepository.save(project);
      
      await this.cacheManager.set(
        `project_${project.serviceName}`,
        project,
        60*60*1000,
      );
      await this.cacheManager.del('all_projects');
      await this.cacheManager.del('all_projects_admin');
      
      return {
        success: true,
        message: 'Project restarted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to restart project: ${error.message}`,
      };
    }
  }
}
