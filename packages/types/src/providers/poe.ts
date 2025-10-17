import type { ModelInfo } from "../model.js"

// Poe
// https://api.poe.com/v1/models
export const poeDefaultModelId = "Claude-Sonnet-4.5"

// TODO(poe): Do we want to hardcode.
export const poeDefaultModelInfo: ModelInfo = {
	maxTokens: 8192,
	contextWindow: 200_000,
	supportsImages: true,
	supportsComputerUse: true,
	supportsPromptCache: true,
	inputPrice: 2.5,
	outputPrice: 12.75,
	cacheWritesPrice: 3.75,
	cacheReadsPrice: 0.3,
	description:
		"Claude Sonnet 4.5 represents a major leap forward in AI capability and alignment. It is the most advanced model released by Anthropic to date, distinguished by dramatic improvements in reasoning, mathematics, and real-world coding. Supports 200k tokens of context..",
}
