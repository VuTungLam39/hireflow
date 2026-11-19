import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

// BR-APP-14
export class TrackApplicationQueryDto {
  @ApiProperty({ description: 'Token trong link theo dõi' })
  @IsString()
  @Length(20, 200)
  t: string;
}

export class WithdrawApplicationDto {
  @ApiProperty({ description: 'Token trong link theo dõi' })
  @IsString()
  @Length(20, 200)
  token: string;
}
