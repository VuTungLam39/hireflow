import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export const CV_TEXT_MIN = 100;
export const CV_TEXT_MAX = 50_000;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// F-FILE-02, BR-FILE-04
export class CvTextDto {
  @ApiProperty({
    description: 'Text CV do HR nhập thay cho file không đọc được chữ',
    minLength: CV_TEXT_MIN,
    maxLength: CV_TEXT_MAX,
  })
  @Transform(trim)
  @IsString()
  @Length(CV_TEXT_MIN, CV_TEXT_MAX)
  text: string;
}
