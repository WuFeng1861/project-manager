import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { Cache } from 'cache-manager';
export declare class ProjectsService {
    private projectRepository;
    private cacheManager;
    private httpService;
    constructor(projectRepository: Repository<Project>, cacheManager: Cache, httpService: HttpService);
    createOrUpdate(createProjectDto: CreateProjectDto, sourceIp?: string, requestIps?: string[]): Promise<Project>;
    findAll(isAdmin: boolean): Promise<Project[]>;
    findOne(serviceName: string, isAdmin: boolean): Promise<Project>;
    restartProject(serviceName: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteProjects(serviceNames: string[]): Promise<{
        success: boolean;
        message: string;
    }>;
    checkProjectIsAlive(): Promise<void>;
    clearSourceIps(serviceName: string): Promise<{
        success: boolean;
        message: string;
    }>;
    pauseProject(projectName: string, hours: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
