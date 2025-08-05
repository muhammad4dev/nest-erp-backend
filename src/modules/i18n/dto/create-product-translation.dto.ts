import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductTranslationDto {
  @ApiProperty({
    example: '0192a7e0-1234-7abc-8def-0123456789ab',
    description: 'Product UUID',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'ar', description: 'Locale code (e.g., en, ar)' })
  @IsString()
  locale: string;

  @ApiProperty({ example: 'قلم أزرق', description: 'Translated product name' })
  @IsString()
  name: string;
}
