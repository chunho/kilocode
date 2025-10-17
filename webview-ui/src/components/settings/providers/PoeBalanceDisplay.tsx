import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"

import { usePoeKeyInfo } from "@/components/ui/hooks/usePoeKeyInfo"

// TODO(poe): This component is a placeholder. The Poe API doesn't currently provide a key info endpoint.
export const PoeBalanceDisplay = ({ apiKey, baseUrl }: { apiKey: string; baseUrl?: string }) => {
	const { data: keyInfo } = usePoeKeyInfo(apiKey, baseUrl)

	if (!keyInfo || !keyInfo.limit) {
		return null
	}

	const formattedBalance = (keyInfo.limit - keyInfo.usage).toFixed(2)

	return (
		<VSCodeLink href="https://poe.com/api_key" className="text-vscode-foreground hover:underline">
			${formattedBalance}
		</VSCodeLink>
	)
}
