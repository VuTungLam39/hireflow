const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu;
const PHONE = /(?<![\p{L}\p{N}(])(?:\(?\+?84\)?|0)(?:[\s.()-]*\d){8,10}(?![\p{L}\p{N}])/gu;
const NUL = String.fromCharCode(0);

// BR-AI-09
export const maskPii = (text: string) => text.replace(EMAIL, '[EMAIL]').replace(PHONE, '[PHONE]');

// BR-FILE-04
export const MIN_CV_TEXT_CHARS = 50;

export const cleanCvText = (text: string) =>
  text
    .normalize('NFC')
    .replaceAll(NUL, '')
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const hasReadableText = (text: string) =>
  text.replace(/[^\p{L}\p{N}]/gu, '').length >= MIN_CV_TEXT_CHARS;
