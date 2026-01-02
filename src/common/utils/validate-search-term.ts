import { SEARCH_TERM_MAX_LENGTH } from '@app/common/constants';
import { validateText } from '@app/common/utils/validate-text';

/**
 * Validates that a search term does not exceed the maximum allowed length
 * @param searchTerm - The search term to validate
 * @throws ValidationException if searchTerm exceeds the maximum length
 */
export function validateSearchTerm(
  searchTerm: string | undefined
): string | undefined {
  if (searchTerm) {
    return validateText(searchTerm, {
      maxLength: SEARCH_TERM_MAX_LENGTH,
      field: 'searchTerm',
      required: false,
      shouldTrim: true,
    });
  }
  return undefined;
}
