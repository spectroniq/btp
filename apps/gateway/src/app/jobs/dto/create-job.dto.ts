import {
  IsString,
  IsUrl,
  IsArray,
  IsDateString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsUrl()
  @IsNotEmpty()
  url!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  tags!: string[];

  @IsString()
  source!: string;

  @IsDateString()
  postedAt!: string;
}
