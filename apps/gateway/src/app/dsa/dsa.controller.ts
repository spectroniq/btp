import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DsaService } from './dsa.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { RecordSolveDto } from './dto/record-solve.dto';
import { ExecuteCodeDto } from './dto/execute-code.dto';

@Controller({ path: 'dsa', version: '1' })
export class DsaController {
  constructor(private readonly dsaService: DsaService) {}

  @Public()
  @Get('problems')
  getProblems() {
    return this.dsaService.findAll();
  }

  @Public()
  @Get('problems/:slug')
  getProblem(@Param('slug') slug: string) {
    return this.dsaService.findBySlug(slug);
  }

  @Get('stats')
  getStats(@CurrentUserId() userId: string) {
    return this.dsaService.getStats(userId);
  }

  @Post('solve')
  recordSolve(@CurrentUserId() userId: string, @Body() dto: RecordSolveDto) {
    return this.dsaService.recordSolve(userId, dto);
  }

  @Post('execute')
  execute(@Body() dto: ExecuteCodeDto) {
    return this.dsaService.executeCode(dto.code, dto.testCases);
  }
}
