import { Controller, Get, Query } from '@nestjs/common';
import { ReferencesService } from './references.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller({ path: 'references', version: '1' })
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  @Public()
  @Get()
  findAll(@Query('category') category?: string) {
    if (category) return this.referencesService.findByCategory(category);
    return this.referencesService.findAll();
  }
}
