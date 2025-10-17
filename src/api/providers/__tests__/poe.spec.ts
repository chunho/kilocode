// npx vitest run api/providers/__tests__/poe.spec.ts

import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI from "openai"

import { PoeHandler } from "../poe"
import { ApiHandlerOptions } from "../../../shared/api"
import { Package } from "../../../shared/package"

const mockCreate = vitest.fn()

vitest.mock("openai", () => {
	return {
		default: vitest.fn().mockImplementation(() => ({
			chat: {
				completions: {
					create: mockCreate,
				},
			},
		})),
	}
})

vitest.mock("delay", () => ({ default: vitest.fn(() => Promise.resolve()) }))

vitest.mock("../fetchers/modelCache", () => ({
	getModels: vitest.fn().mockImplementation(() => {
		return Promise.resolve({
			"claude-4.5-sonnet": {
				maxTokens: 8192,
				contextWindow: 200000,
				supportsImages: true,
				supportsPromptCache: true,
				supportsComputerUse: true,
				inputPrice: 2.5,
				outputPrice: 12.75,
				cacheWritesPrice: 3.75,
				cacheReadsPrice: 0.3,
				description: "Claude Sonnet 4.5",
			},
		})
	}),
}))

describe("PoeHandler", () => {
	const mockOptions: ApiHandlerOptions = {
		poeApiKey: "test-key",
		poeModelId: "claude-4.5-sonnet",
	}

	beforeEach(() => vitest.clearAllMocks())

	it("initializes with correct options", () => {
		const handler = new PoeHandler(mockOptions)
		expect(handler).toBeInstanceOf(PoeHandler)

		expect(OpenAI).toHaveBeenCalledWith({
			baseURL: "https://api.poe.com/v1",
			apiKey: mockOptions.poeApiKey,
			defaultHeaders: {
				"HTTP-Referer": "https://kilocode.ai",
				"X-Title": "Kilo Code",
				"X-KiloCode-Version": Package.version,
				"User-Agent": `Kilo-Code/${Package.version}`,
			},
		})
	})

	it("can use a base URL instead of the default", () => {
		const handler = new PoeHandler({ ...mockOptions, poeBaseUrl: "https://custom.poe.com/v1" })
		expect(handler).toBeInstanceOf(PoeHandler)

		expect(OpenAI).toHaveBeenCalledWith({
			baseURL: "https://custom.poe.com/v1",
			apiKey: mockOptions.poeApiKey,
			defaultHeaders: {
				"HTTP-Referer": "https://kilocode.ai",
				"X-Title": "Kilo Code",
				"X-KiloCode-Version": Package.version,
				"User-Agent": `Kilo-Code/${Package.version}`,
			},
		})
	})

	describe("fetchModel", () => {
		it("returns correct model info when options are provided", async () => {
			const handler = new PoeHandler(mockOptions)
			const result = await handler.fetchModel()

			expect(result).toMatchObject({
				id: mockOptions.poeModelId,
				info: {
					maxTokens: 8192,
					contextWindow: 200000,
					supportsImages: true,
					supportsPromptCache: true,
					supportsComputerUse: true,
					inputPrice: 2.5,
					outputPrice: 12.75,
					cacheWritesPrice: 3.75,
					cacheReadsPrice: 0.3,
					description: "Claude Sonnet 4.5",
				},
			})
		})

		it("returns default model info when options are not provided", async () => {
			const handler = new PoeHandler({})
			const result = await handler.fetchModel()

			expect(result).toMatchObject({
				id: mockOptions.poeModelId,
				info: {
					maxTokens: 8192,
					contextWindow: 200000,
					supportsImages: true,
					supportsPromptCache: true,
					supportsComputerUse: true,
					inputPrice: 2.5,
					outputPrice: 12.75,
					cacheWritesPrice: 3.75,
					cacheReadsPrice: 0.3,
					description: "Claude Sonnet 4.5",
				},
			})
		})
	})

	describe("createMessage", () => {
		it("generates correct stream chunks", async () => {
			const handler = new PoeHandler(mockOptions)

			const mockStream = {
				async *[Symbol.asyncIterator]() {
					yield {
						id: mockOptions.poeModelId,
						choices: [{ delta: { content: "test response" } }],
					}
					yield {
						id: "test-id",
						choices: [{ delta: {} }],
						usage: {
							prompt_tokens: 10,
							completion_tokens: 20,
							prompt_tokens_details: {
								caching_tokens: 5,
								cached_tokens: 2,
							},
						},
					}
				},
			}

			mockCreate.mockResolvedValue(mockStream)

			const systemPrompt = "test system prompt"
			const messages: Anthropic.Messages.MessageParam[] = [{ role: "user" as const, content: "test message" }]

			const generator = handler.createMessage(systemPrompt, messages)
			const chunks = []

			for await (const chunk of generator) {
				chunks.push(chunk)
			}

			// Verify stream chunks
			expect(chunks).toHaveLength(2) // One text chunk and one usage chunk
			expect(chunks[0]).toEqual({ type: "text", text: "test response" })
			expect(chunks[1]).toEqual({
				type: "usage",
				inputTokens: 10,
				outputTokens: 20,
				cacheWriteTokens: 5,
				cacheReadTokens: 2,
				totalCost: expect.any(Number),
			})

			// Verify OpenAI client was called with correct parameters
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					max_tokens: 8192,
					messages: [
						{
							role: "system",
							content: "test system prompt",
						},
						{
							role: "user",
							content: "test message",
						},
					],
					model: "claude-4.5-sonnet",
					stream: true,
					stream_options: { include_usage: true },
					temperature: 0,
				}),
			)
		})

		it("handles reasoning content", async () => {
			const handler = new PoeHandler(mockOptions)

			const mockStream = {
				async *[Symbol.asyncIterator]() {
					yield {
						id: mockOptions.poeModelId,
						choices: [{ delta: { reasoning_content: "thinking..." } }],
					}
					yield {
						id: mockOptions.poeModelId,
						choices: [{ delta: { content: "response" } }],
					}
				},
			}

			mockCreate.mockResolvedValue(mockStream)

			const generator = handler.createMessage("test", [{ role: "user" as const, content: "test" }])
			const chunks = []

			for await (const chunk of generator) {
				chunks.push(chunk)
			}

			expect(chunks).toHaveLength(2)
			expect(chunks[0]).toEqual({ type: "reasoning", text: "thinking..." })
			expect(chunks[1]).toEqual({ type: "text", text: "response" })
		})

		it("handles API errors", async () => {
			const handler = new PoeHandler(mockOptions)
			const mockError = new Error("API Error")
			mockCreate.mockRejectedValue(mockError)

			const generator = handler.createMessage("test", [])
			await expect(generator.next()).rejects.toThrow("API Error")
		})

		it("includes metadata in request", async () => {
			const handler = new PoeHandler(mockOptions)

			const mockStream = {
				async *[Symbol.asyncIterator]() {
					yield {
						id: mockOptions.poeModelId,
						choices: [{ delta: { content: "test" } }],
					}
				},
			}

			mockCreate.mockResolvedValue(mockStream)

			const metadata = { taskId: "task-123", mode: "code" }
			const generator = handler.createMessage("test", [], metadata)

			for await (const chunk of generator) {
				// consume generator
			}

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					poe: { trace_id: "task-123", extra: { mode: "code" } },
				}),
			)
		})
	})

	describe("completePrompt", () => {
		it("returns correct response", async () => {
			const handler = new PoeHandler(mockOptions)
			const mockResponse = { choices: [{ message: { content: "test completion" } }] }

			mockCreate.mockResolvedValue(mockResponse)

			const result = await handler.completePrompt("test prompt")

			expect(result).toBe("test completion")

			expect(mockCreate).toHaveBeenCalledWith({
				model: mockOptions.poeModelId,
				max_tokens: 8192,
				messages: [{ role: "system", content: "test prompt" }],
				temperature: 0,
			})
		})

		it("handles API errors", async () => {
			const handler = new PoeHandler(mockOptions)
			const mockError = new Error("API Error")
			mockCreate.mockRejectedValue(mockError)

			await expect(handler.completePrompt("test prompt")).rejects.toThrow("API Error")
		})

		it("handles unexpected errors", async () => {
			const handler = new PoeHandler(mockOptions)
			mockCreate.mockRejectedValue(new Error("Unexpected error"))

			await expect(handler.completePrompt("test prompt")).rejects.toThrow("Unexpected error")
		})
	})
})
