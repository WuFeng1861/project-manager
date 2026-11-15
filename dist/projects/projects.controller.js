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
const upload_whitelist_guard_1 = require("../admin/guards/upload-whitelist.guard");
const admin_service_1 = require("../admin/admin.service");
const client_ip_util_1 = require("../common/utils/client-ip.util");
let ProjectsController = class ProjectsController {
    constructor(projectsService, adminService) {
        this.projectsService = projectsService;
        this.adminService = adminService;
    }
    async createOrUpdate(createProjectDto, request) {
        return this.projectsService.createOrUpdate(createProjectDto, client_ip_util_1.ClientIpUtil.getClientIp(request), client_ip_util_1.ClientIpUtil.getRequestIps(request));
    }
    async findAll(request, _adminPassword) {
        const isAdmin = await this.checkAdmin(request);
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
    async pauseProject(projectName, time) {
        const hours = Number(time);
        if (!projectName || !hours || hours <= 0) {
            throw new common_1.BadRequestException('projectName 和 time(正数) 参数必填');
        }
        return this.projectsService.pauseProject(projectName, hours);
    }
    async findOne(serviceName, request, _adminPassword) {
        const isAdmin = await this.checkAdmin(request);
        const project = await this.projectsService.findOne(serviceName, isAdmin);
        if (!project) {
            throw new common_1.NotFoundException(`Project with service name ${serviceName} not found`);
        }
        return project;
    }
    async clearSourceIps(serviceName) {
        return this.projectsService.clearSourceIps(serviceName);
    }
    async deleteProjects(serviceNames) {
        return this.projectsService.deleteProjects(serviceNames);
    }
    async checkAdmin(request) {
        const token = admin_service_1.AdminService.extractToken(request);
        if (!token) {
            return false;
        }
        return !!(await this.adminService.validateSession(token));
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(upload_whitelist_guard_1.UploadWhitelistGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Register or update project information' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Project information saved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '来源 IP 不在白名单内，已拦截并加入黑名单' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_project_dto_1.CreateProjectDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "createOrUpdate", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all projects information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns all projects information' }),
    (0, swagger_1.ApiQuery)({
        name: 'adminPassword',
        required: false,
        deprecated: true,
        description: '已废弃，请改用 Authorization: Bearer <token>',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('adminPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
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
    (0, common_1.Get)('pause'),
    (0, swagger_1.ApiOperation)({ summary: '暂停某个项目指定时长内的邮件通知' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '暂停成功' }),
    (0, swagger_1.ApiQuery)({ name: 'projectName', required: true, description: '项目服务名' }),
    (0, swagger_1.ApiQuery)({ name: 'time', required: true, description: '暂停时长（小时）' }),
    __param(0, (0, common_1.Query)('projectName')),
    __param(1, (0, common_1.Query)('time')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "pauseProject", null);
__decorate([
    (0, common_1.Get)(':serviceName'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific project information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns the project information' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Project not found' }),
    (0, swagger_1.ApiQuery)({
        name: 'adminPassword',
        required: false,
        deprecated: true,
        description: '已废弃，请改用 Authorization: Bearer <token>',
    }),
    __param(0, (0, common_1.Param)('serviceName')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('adminPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':serviceName/ip-history'),
    (0, swagger_1.ApiOperation)({ summary: '清空项目的 IP 记录（仅管理员）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'IP 记录已清空' }),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Param)('serviceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "clearSourceIps", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: '删除一个或多个项目' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '项目删除成功' }),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "deleteProjects", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, swagger_1.ApiTags)('projects'),
    (0, common_1.Controller)('projects'),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        admin_service_1.AdminService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map