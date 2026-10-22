import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class BlockedIp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  ip: string;

  @Column()
  blockedUntil: Date;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
