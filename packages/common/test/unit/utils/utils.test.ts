import {
  cleanXml,
  isArray,
  isBoolean,
  isEmpty,
  isError,
  isNil,
  isNumber,
  isObject,
  isString,
  isUndefined,
  maskEmail,
  maskString,
  maskValue,
  normalizeDocument,
  sanitizeDocument,
} from '../../../src';

describe('common utils', () => {
  it('identifies arrays', () => {
    expect(isArray([])).toBe(true);
    expect(isArray({})).toBe(false);
  });

  it('identifies booleans', () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean('true')).toBe(false);
  });

  it('identifies errors', () => {
    expect(isError(new Error('boom'))).toBe(true);
    expect(isError({ message: 'boom' })).toBe(false);
  });

  it('identifies nil values', () => {
    expect(isNil(null)).toBe(true);
    expect(isNil(undefined)).toBe(true);
    expect(isNil(0)).toBe(false);
  });

  it('identifies numbers', () => {
    expect(isNumber(42)).toBe(true);
    expect(isNumber('42')).toBe(false);
  });

  it('identifies objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
    expect(isObject(null)).toBe(false);
  });

  it('identifies strings', () => {
    expect(isString('silkon')).toBe(true);
    expect(isString(123)).toBe(false);
  });

  it('identifies undefined values', () => {
    expect(isUndefined(undefined)).toBe(true);
    expect(isUndefined(null)).toBe(false);
  });

  it('removes dots and dashes', () => {
    expect(sanitizeDocument('17.622.306-5')).toBe('176223065');
  });

  it('preserves letter casing', () => {
    expect(sanitizeDocument('17.622.306-k')).toBe('17622306k');
  });

  it('removes whitespace', () => {
    expect(sanitizeDocument('  176223065  ')).toBe('176223065');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeDocument('')).toBe('');
  });

  it('sanitizes and uppercases', () => {
    expect(normalizeDocument('17.622.306-k')).toBe('17622306K');
  });

  it('is idempotent on already-clean input', () => {
    expect(normalizeDocument('176223065')).toBe('176223065');
  });

  it('collapses multiple whitespace characters into a single space', () => {
    const input = '<a>hello    world\n\n  test</a>';
    const result = cleanXml(input);

    expect(result).toBe('<a>hello world test</a>');
  });

  it('removes whitespace between adjacent tags', () => {
    const input = '<a>   <b>text</b>   </a>';
    const result = cleanXml(input);

    expect(result).toBe('<a><b>text</b></a>');
  });

  it('removes whitespace before a closing bracket', () => {
    const input = '<a  >text</a  >';
    const result = cleanXml(input);

    expect(result).toBe('<a>text</a>');
  });

  it('removes whitespace before a self-closing tag slash', () => {
    const input = '<br  />';
    const result = cleanXml(input);

    expect(result).toBe('<br/>');
  });

  it('removes a lowercase utf-8 xml declaration', () => {
    const input = '<?xml version="1.0" encoding="utf-8"?><root>test</root>';
    const result = cleanXml(input);

    expect(result).toBe('<root>test</root>');
  });

  it('removes an uppercase UTF-8 xml declaration', () => {
    const input = '<?xml version="1.0" encoding="UTF-8"?><root>test</root>';
    const result = cleanXml(input);

    expect(result).toBe('<root>test</root>');
  });

  it('removes an xml declaration even when it originally had extra internal spacing', () => {
    const input = '<?xml   version="1.0"   encoding="utf-8"?><root>test</root>';
    const result = cleanXml(input);

    expect(result).toBe('<root>test</root>');
  });

  it('trims leading and trailing whitespace', () => {
    const input = '   <a>test</a>   ';
    const result = cleanXml(input);

    expect(result).toBe('<a>test</a>');
  });

  it('handles a fully "dirty" xml document end-to-end', () => {
    const input = `
      <?xml version="1.0" encoding="utf-8"?>
      <root>
        <item  >
          value
        </item>
        <empty  />
      </root>
    `;
    const result = cleanXml(input);

    expect(result).toBe('<root><item> value </item><empty/></root>');
  });

  it('stringifies non-string input before cleaning', () => {
    const input = { a: 1, b: 'test' };
    const result = cleanXml(input);

    expect(result).toBe('{"a":1,"b":"test"}');
  });

  it('stringifies a number input before cleaning', () => {
    const result = cleanXml(123);

    expect(result).toBe('123');
  });

  it('returns an empty string for empty input', () => {
    const result = cleanXml('');

    expect(result).toBe('');
  });

  it('leaves an already-clean xml string unchanged', () => {
    const input = '<root><item>value</item></root>';
    const result = cleanXml(input);

    expect(result).toBe(input);
  });

  it('identifies empty inputs with isEmpty', () => {
    expect(isEmpty([])).toBe(true);
    expect(isEmpty([1, 2, 3])).toBe(false);
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty('')).toBe(true);
    expect(isEmpty('hello')).toBe(true);
    expect(isEmpty({})).toBe(true);
    expect(isEmpty(0)).toBe(true);
  });

  it('masks emails properly', () => {
    expect(maskEmail('john.doe@example.com')).toBe('j*******@example.com');
    expect(maskEmail('a@example.com')).toBe('*@example.com');
    expect(maskEmail('ab@example.com')).toBe('a*@example.com');
    expect(maskEmail('@example.com')).toBe('*@example.com');
    expect(maskEmail('plainstring')).toBe('p*********g');
  });

  it('masks values with default and custom configurations', () => {
    expect(maskValue('1234567890', {})).toBe('123****890');
    expect(maskValue('1234567890', { prefix: 2, suffix: 2 })).toBe('12******90');
    expect(maskValue('1234567890', { prefix: 4, suffix: 0 })).toBe('1234******');
    expect(maskValue('1234567890', { prefix: 0, suffix: 4 })).toBe('******7890');
    expect(maskValue('1234567890', { prefix: 2, suffix: 2, length: 3 })).toBe('12***90');
    expect(maskValue('1234567890', { prefix: 2, suffix: 2, character: 'default' })).toBe(
      '12defaultdefaultdefaultdefaultdefaultdefault90',
    );
    expect(maskValue('12345', { prefix: 3, suffix: 3 })).toBe('123345');
    expect(maskValue('test@domain.com', { type: 'email' })).toBe('t***@domain.com');
  });

  it('masks strings containing targeted fields', () => {
    const raw = 'user: admin, password: secretPassword, token=123456789, pin - 9876';
    const masked = maskString(raw, {
      password: { prefix: 1, suffix: 1 },
      token: { prefix: 2, suffix: 2 },
      pin: { prefix: 0, suffix: 0 },
    });

    expect(masked).toBe('user: admin, password: s************d, token=12*****89, pin - ****');
  });

  it('masks string fields matching email type config', () => {
    const raw = 'contact: user@example.com';
    const masked = maskString(raw, { contact: { type: 'email' } });

    expect(masked).toBe('contact: u***@example.com');
  });

  it('handles maskString with undefined fields or no matching fields', () => {
    expect(maskString('no sensitive data here')).toBe('no sensitive data here');
    expect(maskString('password: secret', undefined)).toBe('password: secret');
    expect(maskString('PASSWORD: secretPassword', { password: { prefix: 1, suffix: 1 } })).toBe(
      'PASSWORD: s************d',
    );
  });
});
