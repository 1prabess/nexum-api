import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationEntityType } from '../enums/notification-entity-type.enum';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, (user) => user.notificationsReceived, {
    onDelete: 'CASCADE',
  })
  recipient: User;

  @ManyToOne(() => User, (user) => user.notificationsSent, {
    onDelete: 'CASCADE',
  })
  actor: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationEntityType,
  })
  entityType: NotificationEntityType;

  @Column({ type: 'int' })
  entityId: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 255 })
  targetUrl: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
