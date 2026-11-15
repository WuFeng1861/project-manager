import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 管理员凭据（单行记录，id 恒为 1）
 *
 * 安全约定：
 * - 只保存口令哈希（scrypt），不保存任何明文或可逆密文；
 * - 用户名同样只用于登录比对，不对外暴露给未登录的请求；
 * - 该表不提供任何"非管理员可写"的入口，只有携带有效会话的管理员才能变更。
 */
@Entity()
export class AdminCredential {
  @PrimaryColumn({ type: 'integer' })
  id: number;

  @Column()
  username: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'datetime', nullable: true })
  passwordUpdatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
