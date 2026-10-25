import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesController } from './candidates.controller.js';
import { CandidatesService } from './candidates.service.js';
import { FilesModule } from '../files/files.module.js';
import { Candidate } from './entities/candidate.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Candidate]), FilesModule],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
