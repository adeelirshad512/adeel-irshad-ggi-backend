import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/domain/base-entity';

@Entity()
export class Chat extends BaseEntity {
  @Column()
  userId!: string;

  @Column()
  question!: string;

  @Column()
  answer!: string;
}
