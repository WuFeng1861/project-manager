import {Injectable, NotFoundException, Inject, InternalServerErrorException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { IpMasker } from '../common/utils/ip-masker.util';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private httpService: HttpService,
  ) {
    console.log('ProjectService init')
    setInterval(() => {
      this.checkProjectIsAlive();
    }, 5*60*1000)
  }

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
    await this.cacheManager.del('all_projects_admin');
    
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
  
  async deleteProjects(serviceNames: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const projects = await this.projectRepository.find({
        where: serviceNames.map(name => ({ serviceName: name }))
      });
      
      if (projects.length === 0) {
        throw new NotFoundException('未找到指定的项目');
      }
      
      await this.projectRepository.remove(projects);
      
      // 清除缓存
      for (const project of projects) {
        await this.cacheManager.del(`project_${project.serviceName}`);
        await this.cacheManager.del(`project_${project.serviceName}_admin`);
      }
      await this.cacheManager.del('all_projects');
      await this.cacheManager.del('all_projects_admin');
      
      return {
        success: true,
        message: `成功删除 ${projects.length} 个项目`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('删除项目时发生错误');
    }
  }
  
  async checkProjectIsAlive(): Promise<void> {
    try {
      let aliveProjects: Project[] = await this.findAll(true);
      // 判断项目的运行时间+项目的上次重启时间是否小于现在时间-5分钟 找出停止运行的项目
      aliveProjects = aliveProjects.filter(project => {
        const now = new Date();
        const runtime = project.serviceRuntime * 1000;
        const lastRestartTime = project.lastRestartTime ? new Date(project.lastRestartTime) : null;
        const timeInterval = now.getTime() - (lastRestartTime?.getTime() || 0);
        let isDead = timeInterval - runtime > 5 * 60 * 1000;
        console.log(now.toLocaleString(), timeInterval, runtime, lastRestartTime?.toLocaleString(), isDead)
        return isDead;
      });
      // 请求api发送邮件
      for (const project of aliveProjects) {
        // 如果项目被手动暂停（暂停时间未过期），跳过邮件发送
        const now = new Date();
        if (project.pauseUntil && new Date(project.pauseUntil).getTime() > now.getTime()) {
          continue;
        }
        if (await this.cacheManager.get(`project_${project.serviceName}_alive`)) {
          continue;
        }
        console.log(`${project.serviceName}重启邮件以发送`, new Date().toLocaleString());
        // 添加缓存 每小时只给同一个项目发送一次邮件
        await this.cacheManager.set(
          `project_${project.serviceName}_alive`,
          true,
          60 * 60 * 1000,
        );
        // 构造暂停链接，默认暂停 24 小时，用户可自行修改 time 参数
        const stopUrl = `https://wufeng98.cn/projectManagerApi/projects/pause?time=24&projectName=${project.serviceName}`;
        // 根据上面的fetch请求使用axios api发送邮件
        await axios.post('https://wufeng98.cn/emailServerApi/api/email/send', {
          app: 'WuFeng163',
          templateId: 2,
          templateData: {
            projectName: project.serviceName,
            serverIp: `${project.serverIp}:${project.servicePort}`,
            stopTime: new Date().toLocaleString(),
            stopUrl,
          },
          recipient: '1379459026@qq.com',
          recipientName: 'WuFeng',
        });
      }
    } catch (error) {
      console.log(error.message, 'checkProjectIsAlive error');
    }

  }

  async pauseProject(projectName: string, hours: number): Promise<{ success: boolean; message: string }> {
    const project = await this.projectRepository.findOne({
      where: { serviceName: projectName },
    });
    if (!project) {
      throw new NotFoundException(`Project with service name ${projectName} not found`);
    }
    // 将暂停截止时间持久化到数据库，避免程序重启后丢失暂停状态导致多发邮件
    project.pauseUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    await this.projectRepository.save(project);

    // 清除缓存，使下一次检测读取到最新的 pauseUntil
    await this.cacheManager.del(`project_${projectName}`);
    await this.cacheManager.del(`project_${projectName}_admin`);
    await this.cacheManager.del('all_projects');
    await this.cacheManager.del('all_projects_admin');

    return {
      success: true,
      message: `已暂停 ${projectName} 的邮件通知 ${hours} 小时`,
    };
  }
}
