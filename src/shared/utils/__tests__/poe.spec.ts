import { toPoeServiceUrl } from "../poe"

describe("toPoeServiceUrl", () => {
	const DEFAULT_URL = "https://api.poe.com/v1"

	describe("Default behavior", () => {
		it("should return default URL when no baseUrl provided", () => {
			const result = toPoeServiceUrl()
			expect(result).toBe(DEFAULT_URL)
		})

		it("should return default URL when undefined provided", () => {
			const result = toPoeServiceUrl(undefined)
			expect(result).toBe(DEFAULT_URL)
		})

		it("should return default URL when empty string provided", () => {
			const result = toPoeServiceUrl("")
			expect(result).toBe(DEFAULT_URL)
		})
	})

	describe("Custom URLs", () => {
		it("should accept valid custom URL with /v1", () => {
			const result = toPoeServiceUrl("https://custom.poe.com/v1")
			expect(result).toBe("https://custom.poe.com/v1")
		})

		it("should handle URLs with trailing slash", () => {
			const result = toPoeServiceUrl("https://custom.poe.com/v1/")
			expect(result).toBe("https://custom.poe.com/v1/")
		})

		it("should accept custom URL without /v1", () => {
			const result = toPoeServiceUrl("https://custom.poe.com")
			expect(result).toBe("https://custom.poe.com/")
		})

		it("should handle localhost URLs", () => {
			const result = toPoeServiceUrl("http://localhost:8080/v1")
			expect(result).toBe("http://localhost:8080/v1")
		})

		it("should handle URLs with custom ports", () => {
			const result = toPoeServiceUrl("https://custom.poe.com:3000/v1")
			expect(result).toBe("https://custom.poe.com:3000/v1")
		})
	})

	describe("Invalid URLs", () => {
		it("should fallback to default for invalid URL", () => {
			const result = toPoeServiceUrl("not-a-valid-url")
			expect(result).toBe(DEFAULT_URL)
		})

		it("should fallback to default for malformed URL", () => {
			const result = toPoeServiceUrl("ht!tp://[invalid")
			expect(result).toBe(DEFAULT_URL)
		})

		it("should handle null values", () => {
			const result = toPoeServiceUrl(null as any)
			expect(result).toBe(DEFAULT_URL)
		})

		it("should handle non-string values", () => {
			const result = toPoeServiceUrl(123 as any)
			expect(result).toBe(DEFAULT_URL)
		})
	})

	describe("Edge cases", () => {
		it("should handle URL without protocol", () => {
			const result = toPoeServiceUrl("//custom.poe.com/v1")
			expect(result).toBe("https://custom.poe.com/v1")
		})

		it("should handle URLs with query parameters", () => {
			const result = toPoeServiceUrl("https://custom.poe.com/v1?key=value")
			expect(result).toBe("https://custom.poe.com/v1?key=value")
		})

		it("should handle URLs with hash fragments", () => {
			const result = toPoeServiceUrl("https://custom.poe.com/v1#section")
			expect(result).toBe("https://custom.poe.com/v1#section")
		})

		it("should handle URLs with authentication", () => {
			const result = toPoeServiceUrl("https://user:pass@custom.poe.com/v1")
			expect(result).toBe("https://user:pass@custom.poe.com/v1")
		})
	})
})
