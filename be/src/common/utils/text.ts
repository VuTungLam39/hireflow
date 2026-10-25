// Kickoff 8.4
export const foldText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

// BR-AI-03
export const normalizeText = (value: string) =>
  value.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();

// Database Design 4.5
export const normalizeKeywords = (keywords: string[]) => [
  ...new Set(keywords.map(foldText).filter(Boolean)),
];
