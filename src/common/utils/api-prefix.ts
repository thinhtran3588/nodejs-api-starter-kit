const DEFAULT_API_PREFIX = '/api';

const normalizePath = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed || trimmed === '/') {
    return '/';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')) {
    return withLeadingSlash.slice(0, -1);
  }

  return withLeadingSlash;
};

export const getApiPrefix = (): string => {
  const normalizedPrefix = normalizePath(
    process.env['API_PREFIX'] ?? DEFAULT_API_PREFIX
  );

  if (normalizedPrefix === '/') {
    return '';
  }

  return normalizedPrefix;
};

export const withApiPrefix = (path: string): string => {
  const normalizedPath = normalizePath(path);
  const prefix = getApiPrefix();

  if (!prefix) {
    return normalizedPath;
  }

  if (
    normalizedPath === prefix ||
    normalizedPath.startsWith(`${prefix}/`) ||
    normalizedPath.startsWith(`${prefix}.`)
  ) {
    return normalizedPath;
  }

  if (normalizedPath === '/') {
    return `${prefix}/`;
  }

  return `${prefix}${normalizedPath}`;
};
