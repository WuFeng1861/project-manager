export declare class Project {
    id: number;
    serviceName: string;
    serverIp: string;
    servicePort: number;
    serviceNotes: string;
    serviceRuntime: number;
    serviceDescription: string;
    lastRestartTime: Date;
    projectPassword: string;
    pauseUntil: Date;
    sourceIp: string;
    sourceIps: string[];
    createdAt: Date;
    updatedAt: Date;
}
