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
const axios_2 = require("axios");
let ProjectsService = class ProjectsService {
    constructor(projectRepository, cacheManager, httpService) {
        this.projectRepository = projectRepository;
        this.cacheManager = cacheManager;
        this.httpService = httpService;
        console.log('ProjectService init');
        setInterval(() => {
            this.checkProjectIsAlive();
        }, 5 * 60 * 1000);
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
        await this.cacheManager.del('all_projects_admin');
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
            const url = `http://${project.serverIp}:${project.servicePort}/api/system/restart-p`;
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
    async deleteProjects(serviceNames) {
        try {
            const projects = await this.projectRepository.find({
                where: serviceNames.map(name => ({ serviceName: name }))
            });
            if (projects.length === 0) {
                throw new common_1.NotFoundException('未找到指定的项目');
            }
            await this.projectRepository.remove(projects);
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
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('删除项目时发生错误');
        }
    }
    async checkProjectIsAlive() {
        try {
            let aliveProjects = await this.findAll(true);
            aliveProjects = aliveProjects.filter(project => {
                const now = new Date();
                const runtime = project.serviceRuntime * 1000;
                const lastRestartTime = project.lastRestartTime ? new Date(project.lastRestartTime) : null;
                const timeInterval = now.getTime() - (lastRestartTime?.getTime() || 0);
                let isDead = timeInterval - runtime > 5 * 60 * 1000;
                console.log(now.toLocaleString(), timeInterval, runtime, lastRestartTime?.toLocaleString(), isDead);
                return isDead;
            });
            for (const project of aliveProjects) {
                const now = new Date();
                if (project.pauseUntil && new Date(project.pauseUntil).getTime() > now.getTime()) {
                    continue;
                }
                if (await this.cacheManager.get(`project_${project.serviceName}_alive`)) {
                    continue;
                }
                console.log(`${project.serviceName}重启邮件以发送`, new Date().toLocaleString());
                await this.cacheManager.set(`project_${project.serviceName}_alive`, true, 60 * 60 * 1000);
                const stopUrl = `https://wufeng98.cn/projectManagerApi/projects/pause?time=24&projectName=${project.serviceName}`;
                await axios_2.default.post('https://wufeng98.cn/emailServerApi/api/email/send', {
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
        }
        catch (error) {
            console.log(error.message, 'checkProjectIsAlive error');
        }
    }
    async pauseProject(projectName, hours) {
        const project = await this.projectRepository.findOne({
            where: { serviceName: projectName },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with service name ${projectName} not found`);
        }
        project.pauseUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
        await this.projectRepository.save(project);
        await this.cacheManager.del(`project_${projectName}`);
        await this.cacheManager.del(`project_${projectName}_admin`);
        await this.cacheManager.del('all_projects');
        await this.cacheManager.del('all_projects_admin');
        return {
            success: true,
            message: `已暂停 ${projectName} 的邮件通知 ${hours} 小时`,
        };
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