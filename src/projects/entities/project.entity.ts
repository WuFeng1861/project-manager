import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  serviceName: string;

  @Column()
  serverIp: string;

  @Column()
  servicePort: number;

  @Column({ nullable: true })
  serviceNotes: string;

  @Column({ default: 0 })
  serviceRuntime: number;

  @Column({ nullable: true })
  serviceDescription: string;

  @Column({ nullable: true })
  lastRestartTime: Date;

  @Column()
  projectPassword: string;

  @Column({ nullable: true })
  pauseUntil: Date;

  @Column({ nullable: true })
  sourceIp: string;

  @Column({ type: 'simple-json', nullable: true })
  sourceIps: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}