import { Request as ExpressRequest } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { RestartProjectDto } from './dto/restart-project.dto';
import { IpBlockService } from '../rate-limit/ip-block.service';
export declare class ProjectsController {
    private readonly projectsService;
    private readonly ipBlockService;
    constructor(projectsService: ProjectsService, ipBlockService: IpBlockService);
    createOrUpdate(createProjectDto: CreateProjectDto, request: ExpressRequest): Promise<import("./entities/project.entity").Project>;
    findAll(adminPassword: string): Promise<import("./entities/project.entity").Project[]>;
    listBlockedIps(): Promise<import("../rate-limit/entities/blocked-ip.entity").BlockedIp[]>;
    unblockIp(ip: string): Promise<{
        success: boolean;
        message: string;
    }>;
    restartProject(restartProjectDto: RestartProjectDto): Promise<{
        success: boolean;
        message: string;
    }>;
    pauseProject(projectName: string, time: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findOne(serviceName: string, adminPassword: string): Promise<import("./entities/project.entity").Project>;
    clearSourceIps(serviceName: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteProjects(serviceNames: string[]): Promise<{
        success: boolean;
        message: string;
    }>;
}
