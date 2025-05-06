import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { RestartProjectDto } from './dto/restart-project.dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    createOrUpdate(createProjectDto: CreateProjectDto): Promise<import("./entities/project.entity").Project>;
    findAll(adminPassword: string): Promise<import("./entities/project.entity").Project[]>;
    restartProject(restartProjectDto: RestartProjectDto): Promise<{
        success: boolean;
        message: string;
    }>;
    findOne(serviceName: string, adminPassword: string): Promise<import("./entities/project.entity").Project>;
}
