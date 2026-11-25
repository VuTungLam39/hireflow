import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

// BR-APP-14
// SG-05 · R5
export class TrackApplicationDto {
  @ApiProperty({ description: 'Token trong link theo dõi' })
  @IsString()
  @Length(20, 200)
  token: string;
}

export class WithdrawApplicationDto {
  @ApiProperty({ description: 'Token trong link theo dõi' })
  @IsString()
  @Length(20, 200)
  token: string;
}
