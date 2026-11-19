import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsObject, IsUUID, Min, ValidateIf } from 'class-validator';

// BR-RANK-02
export class SaveRankingWeightsDto {
  @ApiProperty({ description: 'Phiên bản tiêu chí đang xem; lệch với tin thì 409' })
  @IsInt()
  @Min(1)
  jdVersion: number;

  @ApiProperty({ description: 'requirementId → trọng số 1–3', example: { 'uuid-1': 3 } })
  @IsObject()
  weights: Record<string, number>;
}

export class AssignHiringManagerDto {
  @ApiProperty({ nullable: true, description: 'null để bỏ gán' })
  @ValidateIf((o: AssignHiringManagerDto) => o.userId !== null)
  @IsUUID()
  userId: string | null;
}
