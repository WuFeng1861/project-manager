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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const projects_service_1 = require("./projects.service");
const create_project_dto_1 = require("./dto/create-project.dto");
const restart_project_dto_1 = require("./dto/restart-project.dto");
const admin_auth_guard_1 = require("../common/guards/admin-auth.guard");
let ProjectsController = class ProjectsController {
    constructor(projectsService) {
        this.projectsService = projectsService;
    }
    async createOrUpdate(createProjectDto) {
        return this.projectsService.createOrUpdate(createProjectDto);
    }
    async findAll(adminPassword) {
        const isAdmin = adminPassword === 'wufeng1998';
        return this.projectsService.findAll(isAdmin);
    }
    async restartProject(restartProjectDto) {
        try {
            return await this.projectsService.restartProject(restartProjectDto.serviceName);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to restart the service');
        }
    }
    async findOne(serviceName, adminPassword) {
        const isAdmin = adminPassword === 'wufeng1998';
        const project = await this.projectsService.findOne(serviceName, isAdmin);
        if (!project) {
            throw new common_1.NotFoundException(`Project with service name ${serviceName} not found`);
        }
        return project;
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Register or update project information' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Project information saved successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_project_dto_1.CreateProjectDto]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "createOrUpdate", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all projects information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns all projects information' }),
    (0, swagger_1.ApiQuery)({ name: 'adminPassword', required: false, description: 'Admin password for full access' }),
    __param(0, (0, common_1.Query)('adminPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('restart'),
    (0, swagger_1.ApiOperation)({ summary: 'Restart a project service' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Project service restarted successfully' }),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [restart_project_dto_1.RestartProjectDto]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "restartProject", null);
__decorate([
    (0, common_1.Get)(':serviceName'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific project information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns the project information' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Project not found' }),
    (0, swagger_1.ApiQuery)({ name: 'adminPassword', required: false, description: 'Admin password for full access' }),
    __param(0, (0, common_1.Param)('serviceName')),
    __param(1, (0, common_1.Query)('adminPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findOne", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, swagger_1.ApiTags)('projects'),
    (0, common_1.Controller)('projects'),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map