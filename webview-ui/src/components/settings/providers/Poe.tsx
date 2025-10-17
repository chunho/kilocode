import { useCallback } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"

import type { ProviderSettings, OrganizationAllowList } from "@roo-code/types"
import { poeDefaultModelId } from "@roo-code/types"
import type { RouterModels } from "@roo/api"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"
import { ModelPicker } from "@src/components/settings/ModelPicker"
import { PoeBalanceDisplay } from "./PoeBalanceDisplay"

import { inputEventTransform } from "../transforms"

type PoeProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
	routerModels?: RouterModels
	organizationAllowList?: OrganizationAllowList
	modelValidationError?: string
}

export const Poe = ({
	apiConfiguration,
	setApiConfigurationField,
	routerModels,
	organizationAllowList,
	modelValidationError,
}: PoeProps) => {
	const { t } = useAppTranslation()

	const handleInputChange = useCallback(
		<K extends keyof ProviderSettings, E>(
			field: K,
			transform: (event: E) => ProviderSettings[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				setApiConfigurationField(field, transform(event as E))
			},
		[setApiConfigurationField],
	)

	return (
		<>
			<VSCodeTextField
				value={apiConfiguration?.poeApiKey || ""}
				type="password"
				onInput={handleInputChange("poeApiKey")}
				placeholder={t("settings:placeholders.apiKey")}
				className="w-full">
				<div className="flex justify-between items-center mb-1">
					<label className="block font-medium">{t("settings:providers.poeApiKey")}</label>
					{apiConfiguration?.poeApiKey && (
						<PoeBalanceDisplay apiKey={apiConfiguration.poeApiKey} baseUrl={apiConfiguration.poeBaseUrl} />
					)}
				</div>
			</VSCodeTextField>
			<div className="text-sm text-vscode-descriptionForeground -mt-2">
				{t("settings:providers.apiKeyStorageNotice")}
			</div>
			{!apiConfiguration?.poeApiKey && (
				<VSCodeButtonLink href="https://poe.com/api_key" appearance="secondary">
					{t("settings:providers.getPoeApiKey")}
				</VSCodeButtonLink>
			)}

			<ModelPicker
				apiConfiguration={apiConfiguration}
				setApiConfigurationField={setApiConfigurationField}
				defaultModelId={poeDefaultModelId}
				models={routerModels?.poe ?? {}}
				modelIdKey="poeModelId"
				serviceName="Poe"
				serviceUrl="https://poe.com/api_key"
				organizationAllowList={organizationAllowList ?? { allowAll: true, providers: {} }}
				errorMessage={modelValidationError}
			/>
		</>
	)
}
