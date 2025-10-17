import axios from "axios"
import { z } from "zod"
import { useQuery, UseQueryOptions } from "@tanstack/react-query"

// Define schema for Poe key response
// TODO(poe): This endpoint doesn't exist yet. Update this schema once Poe API provides a key info endpoint.
const poeKeyInfoSchema = z.object({
	data: z.object({
		label: z.string().optional(),
		usage: z.number(),
		limit: z.number().nullable(),
	}),
})

export type PoeKeyInfo = z.infer<typeof poeKeyInfoSchema>["data"]

async function getPoeKeyInfo(apiKey?: string, baseUrl?: string) {
	if (!apiKey) return null

	try {
		// Use the provided base URL or default to Poe's API URL
		const apiBaseUrl = baseUrl || "https://api.poe.com/v1"

		// TODO(poe): This endpoint doesn't exist yet. Verify the correct endpoint when Poe API documentation is available.
		const keyEndpoint = `${apiBaseUrl}/key`

		const response = await axios.get(keyEndpoint, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
		})

		const result = poeKeyInfoSchema.safeParse(response.data)
		if (!result.success) {
			console.error("Poe API key info validation failed:", result.error)
			return null
		}

		return result.data.data
	} catch (_error) {
		// Silently fail if endpoint doesn't exist yet
		// console.error("Error fetching Poe key info:", _error)
		return null
	}
}

type UsePoeKeyInfoOptions = Omit<UseQueryOptions<PoeKeyInfo | null>, "queryKey" | "queryFn">
export const usePoeKeyInfo = (apiKey?: string, baseUrl?: string, options?: UsePoeKeyInfoOptions) => {
	return useQuery<PoeKeyInfo | null>({
		queryKey: ["poe-key-info", apiKey, baseUrl],
		queryFn: () => getPoeKeyInfo(apiKey, baseUrl),
		staleTime: 30 * 1000, // 30 seconds
		enabled: !!apiKey,
		...options,
	})
}
