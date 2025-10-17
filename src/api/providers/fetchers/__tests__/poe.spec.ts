// npx vitest run src/api/providers/fetchers/__tests__/poe.spec.ts

import axios from "axios"

import { getPoeModels } from "../poe"

vitest.mock("axios")
const mockedAxios = axios as any

describe("Poe Model Fetcher", () => {
	beforeEach(() => {
		vitest.clearAllMocks()
	})

	describe("getPoeModels", () => {
		const mockResponse = {
			data: {
				data: [
					{
						id: "claude-4.5-sonnet",
						max_output_tokens: 8192,
						context_window: 200000,
						supports_caching: true,
						supports_vision: true,
						supports_computer_use: true,
						supports_reasoning: true,
						input_price: "2.50",
						output_price: "12.75",
						caching_price: "3.75",
						cached_price: "0.30",
						description:
							"Claude Sonnet 4.5 represents a major leap forward in AI capability and alignment.",
					},
					{
						id: "gpt-4o",
						max_output_tokens: 4096,
						context_window: 128000,
						supports_caching: false,
						supports_vision: true,
						supports_computer_use: false,
						supports_reasoning: true,
						input_price: "5.00",
						output_price: "15.00",
						description: "GPT-4o model",
					},
					{
						id: "coding/gemini-2.5-pro",
						max_output_tokens: 8192,
						context_window: 1000000,
						supports_caching: true,
						supports_vision: true,
						supports_computer_use: false,
						supports_reasoning: true,
						input_price: "1.25",
						output_price: "5.00",
						caching_price: "2.50",
						cached_price: "0.3125",
						description: "Gemini 2.5 Pro for coding",
					},
				],
			},
		}

		it("fetches and parses models correctly without API key", async () => {
			mockedAxios.get.mockResolvedValueOnce(mockResponse)

			const models = await getPoeModels()

			expect(mockedAxios.get).toHaveBeenCalledWith("https://api.poe.com/v1/models", { headers: {} })
			expect(Object.keys(models)).toHaveLength(3)
			expect(models["claude-4.5-sonnet"]).toBeDefined()
			expect(models["gpt-4o"]).toBeDefined()
			expect(models["coding/gemini-2.5-pro"]).toBeDefined()
		})

		it("fetches and parses models correctly with API key", async () => {
			mockedAxios.get.mockResolvedValueOnce(mockResponse)

			const models = await getPoeModels("test-api-key")

			expect(mockedAxios.get).toHaveBeenCalledWith("https://api.poe.com/v1/models", {
				headers: {
					Authorization: "Bearer test-api-key",
				},
			})
			expect(Object.keys(models)).toHaveLength(3)
		})

		it("parses model info correctly with all features", () => {
			mockedAxios.get.mockResolvedValueOnce(mockResponse)

			return getPoeModels().then((models) => {
				const claudeModel = models["claude-4.5-sonnet"]
				expect(claudeModel).toEqual({
					maxTokens: 8192,
					contextWindow: 200000,
					supportsPromptCache: true,
					supportsImages: true,
					supportsComputerUse: true,
					supportsReasoningBudget: true,
					supportsReasoningEffort: false,
					inputPrice: 2500000,
					outputPrice: 12750000,
					description: "Claude Sonnet 4.5 represents a major leap forward in AI capability and alignment.",
					cacheWritesPrice: 3750000,
					cacheReadsPrice: 300000,
				})
			})
		})

		it("detects reasoning budget support for Claude models", () => {
			mockedAxios.get.mockResolvedValueOnce(mockResponse)

			return getPoeModels().then((models) => {
				expect(models["claude-4.5-sonnet"].supportsReasoningBudget).toBe(true)
			})
		})

		it("detects reasoning budget support for Gemini coding models", () => {
			mockedAxios.get.mockResolvedValueOnce(mockResponse)

			return getPoeModels().then((models) => {
				expect(models["coding/gemini-2.5-pro"].supportsReasoningBudget).toBe(true)
			})
		})

		it("detects reasoning effort support for OpenAI models", () => {
			mockedAxios.get.mockResolvedValueOnce(mockResponse)

			return getPoeModels().then((models) => {
				expect(models["gpt-4o"].supportsReasoningEffort).toBe(true)
			})
		})

		it("handles models without cache pricing", () => {
			mockedAxios.get.mockResolvedValueOnce(mockResponse)

			return getPoeModels().then((models) => {
				const gpt4Model = models["gpt-4o"]
				expect(gpt4Model.supportsPromptCache).toBe(false)
				expect(gpt4Model.cacheWritesPrice).toBeUndefined()
				expect(gpt4Model.cacheReadsPrice).toBeUndefined()
			})
		})

		it("handles API errors gracefully", async () => {
			const consoleErrorSpy = vitest.spyOn(console, "error").mockImplementation(() => {})
			mockedAxios.get.mockRejectedValueOnce(new Error("Network error"))

			const models = await getPoeModels()

			expect(models).toEqual({})
			expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error fetching Poe models"))
			consoleErrorSpy.mockRestore()
		})

		it("handles empty response", async () => {
			mockedAxios.get.mockResolvedValueOnce({ data: { data: [] } })

			const models = await getPoeModels()

			expect(models).toEqual({})
		})

		it("handles malformed response gracefully", async () => {
			const consoleErrorSpy = vitest.spyOn(console, "error").mockImplementation(() => {})
			mockedAxios.get.mockResolvedValueOnce({ data: { invalid: "response" } })

			const models = await getPoeModels()

			expect(models).toEqual({})
			expect(consoleErrorSpy).toHaveBeenCalled()
			consoleErrorSpy.mockRestore()
		})

		it("continues processing with partially valid data", async () => {
			const partialResponse = {
				data: {
					data: [
						{
							id: "valid-model",
							max_output_tokens: 4096,
							context_window: 128000,
							supports_caching: false,
							supports_vision: true,
							supports_computer_use: false,
							supports_reasoning: false,
							input_price: "2.00",
							output_price: "8.00",
							description: "Valid model",
						},
						{
							id: "invalid-model",
							// Missing required fields
						},
					],
				},
			}

			const consoleErrorSpy = vitest.spyOn(console, "error").mockImplementation(() => {})
			mockedAxios.get.mockResolvedValueOnce(partialResponse)

			const models = await getPoeModels()

			// Should still process the valid model
			expect(models["valid-model"]).toBeDefined()
			consoleErrorSpy.mockRestore()
		})

		it("handles Vertex Gemini models correctly", () => {
			const geminiResponse = {
				data: {
					data: [
						{
							id: "vertex/gemini-2.5-flash",
							max_output_tokens: 8192,
							context_window: 1000000,
							supports_caching: true,
							supports_vision: true,
							supports_computer_use: false,
							supports_reasoning: true,
							input_price: "0.30",
							output_price: "1.20",
							caching_price: "0.45",
							cached_price: "0.075",
							description: "Gemini 2.5 Flash via Vertex AI",
						},
					],
				},
			}

			mockedAxios.get.mockResolvedValueOnce(geminiResponse)

			return getPoeModels().then((models) => {
				expect(models["vertex/gemini-2.5-flash"].supportsReasoningBudget).toBe(true)
			})
		})

		it("handles Google Gemini models with reasoning effort support", () => {
			const geminiResponse = {
				data: {
					data: [
						{
							id: "google/gemini-2.5-pro",
							max_output_tokens: 8192,
							context_window: 2000000,
							supports_caching: true,
							supports_vision: true,
							supports_computer_use: false,
							supports_reasoning: true,
							input_price: "1.25",
							output_price: "5.00",
							caching_price: "2.50",
							cached_price: "0.3125",
							description: "Gemini 2.5 Pro",
						},
					],
				},
			}

			mockedAxios.get.mockResolvedValueOnce(geminiResponse)

			return getPoeModels().then((models) => {
				expect(models["google/gemini-2.5-pro"].supportsReasoningEffort).toBe(true)
			})
		})
	})
})
