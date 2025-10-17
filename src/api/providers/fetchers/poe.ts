import axios from "axios"

import type { ModelInfo } from "@roo-code/types"

import { parseApiPrice } from "../../../shared/cost"
import { toPoeServiceUrl } from "../../../shared/utils/poe"

export async function getPoeModels(apiKey?: string): Promise<Record<string, ModelInfo>> {
	const models: Record<string, ModelInfo> = {}

	try {
		const headers: Record<string, string> = {}

		if (apiKey) {
			headers["Authorization"] = `Bearer ${apiKey}`
		}
		const resolvedBaseUrl = toPoeServiceUrl()
		const modelsUrl = new URL("models", resolvedBaseUrl)

		const response = await axios.get(modelsUrl.toString(), { headers })
		const rawModels = response.data.data

		for (const rawModel of rawModels) {
			const { id, architecture, top_provider, supported_parameters = [] } = rawModel

			const supportText = architecture?.output_modalities?.includes("text")

			if (
				!supportText
				// architecture?.output_modalities?.includes("image") ||
				// architecture?.output_modalities?.includes("video")
			) {
				continue
			}

			const reasoningBudget =
				rawModel.supports_reasoning &&
				(rawModel.id.includes("claude") ||
					rawModel.id.includes("coding/gemini-2.5") ||
					rawModel.id.includes("vertex/gemini-2.5"))
			const reasoningEffort =
				rawModel.supports_reasoning &&
				(rawModel.id.includes("openai") || rawModel.id.includes("google/gemini-2.5"))

			const supportsImages = architecture?.input_modalities?.includes("image") ?? false

			const modelInfo: ModelInfo = {
				// TODO(poe): Currently missing from our `/v1/models` endpoint.
				maxTokens: rawModel.max_output_tokens,
				// TODO(poe): Currently missing from our `/v1/models` endpoint.
				contextWindow: rawModel.context_window,
				// TODO(poe): Currently missing from our `/v1/models` endpoint.
				supportsPromptCache: rawModel.supports_caching,
				supportsImages,
				supportsComputerUse: rawModel.supports_computer_use,
				supportsReasoningBudget: reasoningBudget,
				supportsReasoningEffort: reasoningEffort,
				inputPrice: parseApiPrice(rawModel.pricing?.prompt),
				outputPrice: parseApiPrice(rawModel.pricing?.completion),
				description: rawModel.description,
				// Cache pricing fields - will be undefined if not provided by the API
				cacheWritesPrice: parseApiPrice(
					rawModel.pricing?.cache_creation || rawModel.pricing?.prompt_cache_write,
				),
				cacheReadsPrice: parseApiPrice(rawModel.pricing?.cache_read || rawModel.pricing?.prompt_cache_read),
			}

			models[rawModel.id] = modelInfo
		}
	} catch (error) {
		console.error(`Error fetching Poe models: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
	}

	return models
}
