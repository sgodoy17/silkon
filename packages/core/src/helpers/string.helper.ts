export class StringHelper {
  public static sanitize(
    input: string,
    options: { stripHtml?: boolean; alphanumericOnly?: boolean; collapseWhitespace?: boolean },
  ): string {
    const { stripHtml = true, alphanumericOnly = false, collapseWhitespace = true } = options;

    if (!input) {
      return '';
    }

    let result = input.replace(/(?![\t\n\r])\p{Cc}/gu, '');

    if (stripHtml) {
      result = result.replace(/<[^>]*>/g, '');
    }

    if (alphanumericOnly) {
      result = result.replace(/[^a-zA-Z0-9\s]/g, '');
    }

    if (collapseWhitespace) {
      result = result.replace(/\s+/g, ' ').trim();
    }

    return result;
  }
}
