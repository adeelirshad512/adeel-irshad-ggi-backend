import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/domain/base-entity';
import { SubscriptionType } from '../../enums/subscription-type';

@Entity()
export class Subscription extends BaseEntity {
  @Column()
  userId!: string;

  @Column({ type: 'varchar', enum: SubscriptionType })
  type!: SubscriptionType;

  @Column()
  autoRenew!: boolean;

  @Column({ default: 10 })
  responses: number = 10;

  @Column({ type: 'timestamp', nullable: true })
  renewedAt?: Date;
}
