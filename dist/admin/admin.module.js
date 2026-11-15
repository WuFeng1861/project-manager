"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_credential_entity_1 = require("./entities/admin-credential.entity");
const admin_session_entity_1 = require("./entities/admin-session.entity");
const ip_whitelist_entity_1 = require("./entities/ip-whitelist.entity");
const project_entity_1 = require("../projects/entities/project.entity");
const ip_block_module_1 = require("../rate-limit/ip-block.module");
const admin_service_1 = require("./admin.service");
const ip_whitelist_service_1 = require("./ip-whitelist.service");
const admin_controller_1 = require("./admin.controller");
const admin_token_guard_1 = require("./guards/admin-token.guard");
const upload_whitelist_guard_1 = require("./guards/upload-whitelist.guard");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                admin_credential_entity_1.AdminCredential,
                admin_session_entity_1.AdminSession,
                ip_whitelist_entity_1.IpWhitelist,
                project_entity_1.Project,
            ]),
            ip_block_module_1.IpBlockModule,
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [
            admin_service_1.AdminService,
            ip_whitelist_service_1.IpWhitelistService,
            admin_token_guard_1.AdminTokenGuard,
            upload_whitelist_guard_1.UploadWhitelistGuard,
        ],
        exports: [
            admin_service_1.AdminService,
            ip_whitelist_service_1.IpWhitelistService,
            admin_token_guard_1.AdminTokenGuard,
            upload_whitelist_guard_1.UploadWhitelistGuard,
        ],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map