import { randomBytes } from 'node:crypto';
import { EnvelopeService } from '../../src';

describe('EnvelopeService', () => {
  const envelope = new EnvelopeService(randomBytes(32).toString('base64'));

  const cases: Array<[string, string | Buffer | object]> = [
    ['tiny string', 'a'],
    ['string with quotes and newlines', 'hello "world"\n<xml attr="1"/>'],
    ['large repetitive string', '<item>value</item>'.repeat(1_000)],
    ['json object', { id: 1, name: 'x', items: [1, 2, 3], nested: { ok: true } }],
    ['json array', Array.from({ length: 500 }, (_, i) => ({ i }))],
    ['binary', Buffer.from([0, 255, 10, 13, 128, 127])],
  ];

  describe.each([true, false])('with compress = %s', compress => {
    it.each(cases)('should round-trip a %s', (_name, value) => {
      const encrypted = envelope.encrypt(value, compress);
      const decrypted = envelope.decrypt(encrypted);

      expect(decrypted).toEqual(value);
    });
  });
});
