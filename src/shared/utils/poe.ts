const POE_BASE_URL = "https://api.poe.com/v1/"
// const POE_BASE_URL = "https://chunho-testing.quora.net/v1/"

/**
 * Converts a base URL to a Poe service URL with proper validation and fallback
 * @param baseUrl Optional custom base URL. Falls back to default if invalid or not provided
 * @returns A valid Poe service URL
 */
export const toPoeServiceUrl = (baseUrl?: string | null): string => {
	// Handle null, undefined, empty string, or non-string values
	const urlToUse = baseUrl && typeof baseUrl === "string" && baseUrl.trim() ? baseUrl.trim() : POE_BASE_URL

	try {
		// Validate the URL first
		return new URL(urlToUse).toString()
	} catch (error) {
		// If the provided baseUrl is invalid, fall back to the default
		if (baseUrl && baseUrl !== POE_BASE_URL) {
			console.warn(`Invalid base URL "${baseUrl}", falling back to default`)
		}
		return POE_BASE_URL
	}
}
