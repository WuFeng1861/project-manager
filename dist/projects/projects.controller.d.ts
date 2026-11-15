import { Request as ExpressRequest } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { RestartProjectDto } from './dto/restart-project.dto';
import { AdminService } from '../admin/admin.service';
export declare class ProjectsController {
    private readonly projectsService;
    private readonly adminService;
    constructor(projectsService: ProjectsService, adminService: AdminService);
    createOrUpdate(createProjectDto: CreateProjectDto, request: ExpressRequest): Promise<import("./entities/project.entity").Project>;
    findAll(request: ExpressRequest, _adminPassword?: string): Promise<import("./entities/project.entity").Project[]>;
    restartProject(restartProjectDto: RestartProjectDto): Promise<{
        success: boolean;
        message: string;
    }>;
    pauseProject(projectName: string, time: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findOne(serviceName: string, request: ExpressRequest, _adminPassword?: string): Promise<import("./entities/project.entity").Project>;
    clearSourceIps(serviceName: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteProjects(serviceNames: string[]): Promise<{
        success: boolean;
        message: string;
    }>;
    private checkAdmin;
}
