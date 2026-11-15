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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWhitelistDto = exports.BlockIpDto = exports.ChangeCredentialsDto = exports.LoginDto = exports.SetupAdminDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SetupAdminDto {
}
exports.SetupAdminDto = SetupAdminDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '管理员账号' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], SetupAdminDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '管理员密码（至少 8 位）' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], SetupAdminDto.prototype, "password", void 0);
class LoginDto {
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '管理员账号' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '管理员密码' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class ChangeCredentialsDto {
}
exports.ChangeCredentialsDto = ChangeCredentialsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '当前密码（用于二次确认）' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChangeCredentialsDto.prototype, "currentPassword", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '新账号，留空表示不修改' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], ChangeCredentialsDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '新密码，留空表示不修改' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], ChangeCredentialsDto.prototype, "newPassword", void 0);
class BlockIpDto {
}
exports.BlockIpDto = BlockIpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '要封禁的 IP' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BlockIpDto.prototype, "ip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '封禁时长（小时），留空使用默认值' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], BlockIpDto.prototype, "durationHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '封禁原因' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], BlockIpDto.prototype, "reason", void 0);
class AddWhitelistDto {
}
exports.AddWhitelistDto = AddWhitelistDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '加入白名单的 IP' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddWhitelistDto.prototype, "ip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '备注，例如所属项目' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], AddWhitelistDto.prototype, "note", void 0);
//# sourceMappingURL=admin.dto.js.map