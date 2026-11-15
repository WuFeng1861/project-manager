import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * 管理员登录会话
 *
 * 数据库只保存 token 的 SHA-256 摘要，即使数据库泄露也无法直接拿去调用接口。
 */
@Entity()
export class AdminSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  tokenHash: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'datetime', nullable: true })
  lastSeenAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
