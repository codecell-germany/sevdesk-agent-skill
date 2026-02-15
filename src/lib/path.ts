export function resolvePathTemplate(
  pathTemplate: string,
  pathParams: Record<string, string>
): string {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_full, key: string) => {
    const value = pathParams[key];
    if (value === undefined) {
      throw new Error(`Missing required path parameter: ${key}`);
    }
    return encodeURIComponent(value);
  });
}
