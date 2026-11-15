import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 允许上报项目信息的来源 IP 白名单
 */
@Entity()
export class IpWhitelist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  ip: string;

  @Column({ nullable: true })
  note: string;

  @Column({ default: 1 })
  enabled: number;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
