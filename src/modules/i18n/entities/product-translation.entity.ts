import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from '../../inventory/entities/product.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('product_translations')
export class ProductTranslation extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ApiProperty({ example: 'ar' })
  @Column({ length: 5 }) // e.g., 'en', 'ar'
  locale: string;

  @ApiProperty({ example: 'منتج تجريبي' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'وصف منتج تجريبي بالتفصيل' })
  @Column({ nullable: true, type: 'text' })
  description: string;
}
