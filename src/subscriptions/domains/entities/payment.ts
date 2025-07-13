import { Entity, Column, PrimaryColumn } from 'typeorm';
import { generateId } from '../../../shared/utils/uuid';
import { BaseEntity } from '../../../shared/domain/base-entity';

@Entity()
export class Payment extends BaseEntity {
  @Column()
  subscriptionId!: string;

  @Column()
  amount!: number;
}
