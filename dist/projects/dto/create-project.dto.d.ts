export declare class CreateProjectDto {
    serviceName: string;
    serverIp: string;
    servicePort: number;
    serviceNotes?: string;
    serviceRuntime: number;
    serviceDescription?: string;
    lastRestartTime?: Date;
    projectPassword: string;
}
