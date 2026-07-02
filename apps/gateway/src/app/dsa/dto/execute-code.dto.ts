import { IsArray, IsString } from 'class-validator';

export class ExecuteCodeDto {
  @IsString() code: string;
  @IsArray() testCases: { input: unknown; expected: unknown }[];
}
