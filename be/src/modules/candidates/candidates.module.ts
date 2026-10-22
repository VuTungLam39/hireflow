import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from './entities/candidate.entity.js';

// TODO BE-12: controller, service
@Module({
  imports: [TypeOrmModule.forFeature([Candidate])],
})
export class CandidatesModule {}
