import { sanitizeDocument } from './sanitize-document.util';

export const normalizeDocument = (input: string) => sanitizeDocument(input).toUpperCase();
