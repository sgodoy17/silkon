import { StringHelper } from '../../../src';

describe('StringHelper.sanitize', () => {
  describe('empty/falsy input', () => {
    it('returns empty string for empty input', () => {
      expect(StringHelper.sanitize('', {})).toBe('');
    });

    it('returns empty string for null input', () => {
      expect(StringHelper.sanitize(null, {})).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(StringHelper.sanitize(undefined as unknown as string, {})).toBe('');
    });
  });

  describe('control character removal (always applied)', () => {
    it('strips null and other control characters', () => {
      expect(StringHelper.sanitize('hello\x00\x1Fworld', {})).toBe('helloworld');
    });

    it('strips unicode control characters like NEL', () => {
      expect(StringHelper.sanitize('hello\u0085world', {})).toBe('helloworld');
    });
  });

  describe('stripHtml option', () => {
    it('strips HTML tags by default', () => {
      expect(StringHelper.sanitize('<b>hello</b> world', {})).toBe('hello world');
    });

    it('strips HTML tags when stripHtml is explicitly true', () => {
      expect(StringHelper.sanitize('<b>hello</b>', { stripHtml: true })).toBe('hello');
    });

    it('preserves tags when stripHtml is false', () => {
      expect(StringHelper.sanitize('<b>hello</b>', { stripHtml: false })).toBe('<b>hello</b>');
    });
  });

  describe('alphanumericOnly option', () => {
    it('does not strip punctuation/symbols by default', () => {
      expect(StringHelper.sanitize('hello, world!', {})).toBe('hello, world!');
    });

    it('strips non-alphanumeric characters when alphanumericOnly is true', () => {
      expect(StringHelper.sanitize('hello, world!', { alphanumericOnly: true })).toBe(
        'hello world',
      );
    });

    it('strips accented characters entirely when alphanumericOnly is true', () => {
      expect(StringHelper.sanitize('José Ñuñoa', { alphanumericOnly: true })).toBe('Jos uoa');
    });

    it('preserves numbers when alphanumericOnly is true', () => {
      expect(StringHelper.sanitize('order #123!', { alphanumericOnly: true })).toBe('order 123');
    });
  });

  describe('collapseWhitespace option', () => {
    it('collapses multiple spaces and trims by default', () => {
      expect(StringHelper.sanitize('  hello    world  ', {})).toBe('hello world');
    });

    it('collapses newlines and tabs into single spaces', () => {
      expect(StringHelper.sanitize('line1\n\nline2\t\ttext', {})).toBe('line1 line2 text');
    });

    it('preserves original whitespace when collapseWhitespace is false', () => {
      expect(StringHelper.sanitize('  hello    world  ', { collapseWhitespace: false })).toBe(
        '  hello    world  ',
      );
    });
  });

  describe('combined options', () => {
    it('applies stripHtml, alphanumericOnly, and collapseWhitespace together', () => {
      const input = '<b>José</b>   Ñuñoa!!   123';
      const result = StringHelper.sanitize(input, {
        stripHtml: true,
        alphanumericOnly: true,
        collapseWhitespace: true,
      });

      expect(result).toBe('Jos uoa 123');
    });

    it('applies only control-char stripping when all options are false', () => {
      const input = '<b>hello</b>\x00   world!!';
      const result = StringHelper.sanitize(input, {
        stripHtml: false,
        alphanumericOnly: false,
        collapseWhitespace: false,
      });

      expect(result).toBe('<b>hello</b>   world!!');
    });

    it('applies default options when an empty options object is passed', () => {
      const input = '<b>hello</b>   world!!';
      const result = StringHelper.sanitize(input, {});

      expect(result).toBe('hello world!!');
    });
  });
});
