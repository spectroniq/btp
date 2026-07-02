import { IsEnum, IsString } from 'class-validator';
import { Difficulty } from '../../../generated/prisma/client';

export class RecordSolveDto {
  @IsString() slug: string;
  @IsString() title: string;
  @IsEnum(Difficulty) difficulty: Difficulty;
  @IsString() topic: string;
  @IsString() code: string;
}
