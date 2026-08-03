import { ObjectHelper } from '@silkon/core';
import { parseString } from 'xml2js';

export class SoapHelper {
  public static isSoapFaultError(error: unknown): boolean {
    const data = ObjectHelper.getValue<string>(error, 'response.data');

    if (!data) {
      return false;
    }

    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      ObjectHelper.isValid(this.xmlToObject(data), 'Fault') &&
      typeof (error as Error).message === 'string'
    );
  }

  public static xmlToObject(data: unknown): unknown {
    let body: unknown;

    parseString(
      data,
      {
        explicitArray: false,
        attrkey: 'attributes',
        ignoreAttrs: true,
        tagNameProcessors: [name => name.replace(/^[^:]+:/, '')],
      },
      (error: unknown, result: unknown) => {
        if (error) {
          throw error;
        }

        body = ObjectHelper.getValue<unknown>(result, 'Envelope.Body');
      },
    );

    return body;
  }
}
