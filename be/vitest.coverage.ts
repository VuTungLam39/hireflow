// Kickoff 1.3 G4: coverage từ 70% cho service lõi (đo gộp unit + e2e)
export const coreCoverage = (reportsDirectory: string) => ({
  provider: 'v8' as const,
  reportsDirectory,
  reporter: ['json', 'json-summary', 'text-summary'],
  include: [
    'src/modules/**/*.service.ts',
    'src/modules/ai/scoring.ts',
    'src/modules/ai/cv-*.ts',
    'src/modules/applications/application-status.ts',
    'src/common/guards/*.ts',
  ],
  exclude: ['**/*.spec.ts', '**/index.ts'],
});
