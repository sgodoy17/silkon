import { request as http } from 'node:http';
import { request as https } from 'node:https';

import { GeneralException } from '@silkon/common';

import { HttpOption } from '../types';

export class HttpClient {
  public post(url: URL, body: string, options: HttpOption): Promise<void> {
    const timeout = options.timeout;
    const request = url.protocol === 'https:' ? https : http;

    return new Promise<void>((resolve, reject) => {
      const client = request(
        url,
        {
          method: options.method,
          timeout,
          headers: options.headers,
          signal: AbortSignal.timeout(timeout),
        },
        response => {
          response.resume();

          if (response.statusCode && response.statusCode >= 400) {
            reject(new GeneralException(`Loki rejected logs: ${response.statusCode}`));
          } else {
            resolve();
          }
        },
      );

      client.on('timeout', () => {
        client.destroy(new GeneralException(`Request to ${url.host} timed out`));
      });

      client.on('error', reject);

      client.end(body);
    });
  }
}
