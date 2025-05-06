"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const project_entity_1 = require("./entities/project.entity");
const ip_masker_util_1 = require("../common/utils/ip-masker.util");
const cache_manager_1 = require("@nestjs/cache-manager");
const rxjs_1 = require("rxjs");
let ProjectsService = class ProjectsService {
    constructor(projectRepository, cacheManager, httpService) {
        this.projectRepository = projectRepository;
        this.cacheManager = cacheManager;
        this.httpService = httpService;
    }
    async createOrUpdate(createProjectDto) {
        let project = await this.projectRepository.findOne({
            where: { serviceName: createProjectDto.serviceName },
        });
        if (project) {
            project = this.projectRepository.merge(project, createProjectDto);
        }
        else {
            project = this.projectRepository.create(createProjectDto);
        }
        const savedProject = await this.projectRepository.save(project);
        await this.cacheManager.set(`project_${savedProject.serviceName}`, savedProject, 60 * 60 * 1000);
        await this.cacheManager.del('all_projects');
        return savedProject;
    }
    async findAll(isAdmin) {
        const cacheKey = isAdmin ? 'all_projects_admin' : 'all_projects';
        const cachedProjects = await this.cacheManager.get(cacheKey);
        if (cachedProjects) {
            return cachedProjects;
        }
        const projects = await this.projectRepository.find();
        const processedProjects = projects.map(project => {
            if (!isAdmin) {
                return {
                    ...project,
                    serverIp: ip_masker_util_1.IpMasker.maskIp(project.serverIp),
                };
            }
            return project;
        });
        await this.cacheManager.set(cacheKey, processedProjects, 60 * 60 * 1000);
        return processedProjects;
    }
    async findOne(serviceName, isAdmin) {
        const cacheKey = `project_${serviceName}${isAdmin ? '_admin' : ''}`;
        const cachedProject = await this.cacheManager.get(cacheKey);
        if (cachedProject) {
            return cachedProject;
        }
        const project = await this.projectRepository.findOne({
            where: { serviceName },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with service name ${serviceName} not found`);
        }
        let processedProject = project;
        if (!isAdmin) {
            processedProject = {
                ...project,
                serverIp: ip_masker_util_1.IpMasker.maskIp(project.serverIp),
            };
        }
        await this.cacheManager.set(cacheKey, processedProject, 60 * 60 * 1000);
        return processedProject;
    }
    async restartProject(serviceName) {
        const project = await this.projectRepository.findOne({
            where: { serviceName },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with service name ${serviceName} not found`);
        }
        try {
            const url = `http://${project.serverIp}:${project.servicePort}/system/restart-p`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, { password: project.projectPassword }));
            project.lastRestartTime = new Date();
            await this.projectRepository.save(project);
            await this.cacheManager.set(`project_${project.serviceName}`, project, 60 * 60 * 1000);
            await this.cacheManager.del('all_projects');
            await this.cacheManager.del('all_projects_admin');
            return {
                success: true,
                message: 'Project restarted successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to restart project: ${error.message}`,
            };
        }
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object, axios_1.HttpService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map