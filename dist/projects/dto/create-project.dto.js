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
exports.CreateProjectDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateProjectDto {
}
exports.CreateProjectDto = CreateProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique name of the service' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "serviceName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'IP address of the server' }),
    (0, class_validator_1.IsIP)(4),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "serverIp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Port number of the service' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateProjectDto.prototype, "servicePort", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notes about the service' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "serviceNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Runtime of the service in seconds' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateProjectDto.prototype, "serviceRuntime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description of the service' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "serviceDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last time the service was restarted' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreateProjectDto.prototype, "lastRestartTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Password for the project' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "projectPassword", void 0);
//# sourceMappingURL=create-project.dto.js.map