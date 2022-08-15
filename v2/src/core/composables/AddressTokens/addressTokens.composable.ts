import { TokenOwnersFragment, useGetOwnersErc20TokensQuery } from '@module/address/apollo/tokens.generated'
import { computed, ref, watch } from 'vue'
import { MarketDataFragment as TokenMarketData } from '@core/composables/CoinData/getLatestPrices.generated'
import { useCoinData } from '@core/composables/CoinData/coinData.composable'
import { TokenSort } from '@module/address/models/TokenSort'
import { formatFloatingPointValue, FormattedNumber } from '@core/helper/number-format-helper'
import BN from 'bignumber.js'

export function useAddressToken(addressHash: string) {
    const { getEthereumTokensMap, loading: loadingEthTokens } = useCoinData()
    const {
        result: erc20TokensResult,
        loading: loadingTokens,
        refetch: refetchTokens,
        onResult: onErc20TokensLoaded
    } = useGetOwnersErc20TokensQuery(
        {
            hash: addressHash
        },
        { notifyOnNetworkStatusChange: true }
    )

    const erc20Tokens = computed<Array<TokenOwnersFragment | null> | undefined>(() => {
        return erc20TokensResult.value?.getOwnersERC20Tokens.owners
    })

    const initialLoad = computed<boolean>(() => {
        return erc20TokensResult.value ? false : true
    })

    /**
     * Gets an object with all sorted arrays
     *
     * @returns false OR Map<string, TokenMarketData>  if values have been loaded
     * @returns  null  otherwise
     */
    const tokenPrices = computed<Map<string, TokenMarketData> | false | null>(() => {
        if (!loadingTokens.value && erc20Tokens.value && !loadingEthTokens.value) {
            const contracts: string[] = []
            erc20Tokens.value.forEach(token => {
                if (token) {
                    contracts.push(token.tokenInfo.contract)
                }
            })
            if (contracts.length > 0) {
                return getEthereumTokensMap(contracts)
            }
        }
        return null
    })

    /**
     * Gets an object with all sorted arrays
     * @param {String} contract
     * @returns
     * - TokenSort if all has been loaded
     * - false if still loading
     */

    const tokenSort = computed<TokenSort | false>(() => {
        if (!loadingTokens.value && erc20Tokens.value && tokenPrices.value !== null) {
            return new TokenSort(erc20Tokens.value, tokenPrices.value, true)
        }
        return false
    })

    const tokenBalance = computed<FormattedNumber | number>(() => {
        if (tokenSort.value) {
            const tokenAmounts = tokenSort.value.usdValue?.ascend.reduce((acc, el) => {
                return new BN(el.usdValue).plus(acc).toNumber()
            }, 0)
            if (tokenAmounts) {
                return formatFloatingPointValue(new BN(tokenAmounts))
            }
        }
        return 0
    })

    return { erc20Tokens, tokenPrices, loadingTokens, refetchTokens, tokenSort, tokenBalance, initialLoad }
}
