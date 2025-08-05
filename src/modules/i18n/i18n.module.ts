import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nService } from './i18n.service';
import { I18nController } from './i18n.controller';
import { ProductTranslation } from './entities/product-translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductTranslation])],
  providers: [I18nService],
  controllers: [I18nController],
})
export class I18nModule {}
