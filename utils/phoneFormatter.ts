/**
 * Formats a phone number to the Yemeni international standard (+967 XXX XXX XXX).
 * It handles common local formats. If the input doesn't match a known
 * Yemeni format, it's returned as is.
 * @param input The raw phone number string.
 * @returns The formatted phone number string or the original input.
 */
export const formatYemeniPhoneNumber = (input: string): string => {
    if (!input?.trim()) {
        return '';
    }

    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');

    // Case 1: Already has country code (e.g., 967717597203)
    // This covers numbers starting with +967, 00967, or just 967.
    if (digits.startsWith('967') && digits.length === 12) {
        const nationalNumber = digits.substring(3);
        return `+967 ${nationalNumber.substring(0, 3)} ${nationalNumber.substring(3, 6)} ${nationalNumber.substring(6, 9)}`;
    }

    // Case 2: Local number with leading 0 (e.g., 0717597203)
    if (digits.startsWith('0') && digits.length === 10) {
        const nationalNumber = digits.substring(1);
        if (nationalNumber.startsWith('7')) {
            return `+967 ${nationalNumber.substring(0, 3)} ${nationalNumber.substring(3, 6)} ${nationalNumber.substring(6, 9)}`;
        }
    }

    // Case 3: Local number without leading 0 (e.g., 717597203)
    if (digits.length === 9 && digits.startsWith('7')) {
         return `+967 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)}`;
    }

    // If it doesn't match a known Yemeni pattern, return the original input
    // to avoid incorrectly formatting numbers from other countries.
    return input;
};
