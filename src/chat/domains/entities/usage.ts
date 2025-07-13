import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/domain/base-entity';

@Entity()
export class Usage extends BaseEntity {
  @Column()
  userId!: string;

  @Column({ default: 3 })
  freeResponses: number = 3;

  @Column({ default: 0 })
  bundleResponses: number = 0;
}
