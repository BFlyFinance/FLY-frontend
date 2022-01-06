import { CONTRACT_ADDRESS, KEY_Balance, TOKEN_FLY, ToChainAmount, ToHumanAmount, chainRpc, requestChain, resultDesc } from "./index";
import TxnWrapper, { JsonProvider } from "./TxnWrapper";
import { iBondDetail, iStakeDetail } from "../store/slices/account-slice";
import BigNumber from "bignumber.js";

export const GetTransactionStatus = (txHash: string) => {
    return JsonProvider(chainRpc()).getTransactionInfo(txHash);
};

// ========================================================
// Market Index
// ========================================================
export const getMarketIndex = async () => {
    try {
        const result = await requestChain("contract.call_v2", [
            {
                function_id: `${CONTRACT_ADDRESS}::Stake::index`,
                args: [],
                type_args: [],
            },
        ]);
        return result.data?.result;
    } catch (e) {
        return e;
    }
};

// ========================================================
// Use FLY Balance
// ========================================================
export const getUserFLYBalance = async (address: string) => {
    try {
        const result = await requestChain("state.get_resource", [address, KEY_Balance(TOKEN_FLY), { decode: true }]);

        return result?.data?.result?.json?.token?.value || 0;
    } catch (e) {
        return e;
    }
};

// ========================================================
// User Staked
// ========================================================
export const getUserStakedAndBond = async (address: string) => {
    try {
        const stakedDetail = resultDesc(await requestChain("state.get_resource", [address, `${CONTRACT_ADDRESS}::Stake::SFLY`, { decode: true }])) as iStakeDetail;
        const bondDetail = resultDesc(
            await requestChain("state.get_resource", [address, `${CONTRACT_ADDRESS}::Bond::Bond<0x00000000000000000000000000000001::STC::STC>`, { decode: true }]),
        ) as iBondDetail;
        const bondReleasedDetail = resultDesc(await requestChain("state.get_resource", [address, `${CONTRACT_ADDRESS}::Bond::ReleasedRate`, { decode: true }]));

        return {
            stakedDetail,
            bondDetail,
            bondReleasedDetail,
        };
    } catch (e) {
        return e;
    }
};

// ========================================================
// Bond List
// ========================================================
export interface iBondData {
    name: string;
    tokenAddress: string;
    tokens?: string[];
    vesting_term?: number;
    total_purchased?: number;
    bond_price_usd?: number;
    roi: {
        (oracle_price_fly: number): BigNumber;
    };
    purchased: {
        (oracle_price_lp: number): BigNumber;
    };
}

interface iRoiCalcuData {
    bond_price_usd: string | BigNumber;
    oracle_price_fly: string | BigNumber;
}

export const ROICalcu = ({ bond_price_usd, oracle_price_fly }: iRoiCalcuData) => {
    // (1 - bond_price / oracle_price<FLY>) * 100  (%)
    return new BigNumber(1).minus(new BigNumber(bond_price_usd).div(oracle_price_fly)).times(100);
};

export const getBondList = async () => {
    try {
        const result: any = await requestChain("state.list_resource", [CONTRACT_ADDRESS, { decode: true }]);
        const { resources } = result?.data?.result;

        const list: iBondData[] = await Promise.all(
            Object.keys(resources).map(async key => {
                if (key.indexOf(`0x00000000000000000000000000000001::Config::Config<${CONTRACT_ADDRESS}::Config::BondConfig`) > -1) {
                    const { payload } = resources[key].json;
                    const tokenResult = key.match(new RegExp(`0x00000000000000000000000000000001::Config::Config<${CONTRACT_ADDRESS}::Config::BondConfig<(.+)>>`)) || [];
                    let tokenAddress = "";

                    if (tokenResult?.length > 1) {
                        tokenAddress = tokenResult[1];
                    }

                    const [bond_price_usd] = (await getBondPriceUSD(tokenAddress)) || [];
                    const { total_debt, total_purchased, last_update_time } = (await getBondInfo(tokenAddress)) as iBondInfo;

                    const matchResult = key.match(/.+(<.*?>).+/);
                    if (matchResult && matchResult.length > 1) {
                        const tokens = matchResult[1]
                            .replace(/[<>]/g, "")
                            .split(",")
                            .map(token => token.trim());
                        const tokenNames = tokens.map(token => token.split("::").pop());

                        // ROI = (1 - bond_price / oracle_price<FLY>) * 100  (%)
                        // purchased = total_purchased * oracle_price<token_type>

                        return {
                            tokens,
                            tokenAddress,
                            total_debt,
                            total_purchased,
                            last_update_time,
                            bond_price_usd,
                            name: `${tokenNames.join("-")}${tokens.length > 1 ? " LP" : ""}`,
                            roi: (oracle_price_fly: number) =>
                                ROICalcu({
                                    bond_price_usd,
                                    oracle_price_fly: new BigNumber(oracle_price_fly),
                                } as iRoiCalcuData),
                            purchased: (oracle_price_lp: number) => {
                                return new BigNumber(total_purchased).times(oracle_price_lp);
                            },
                            ...payload,
                        };
                    }
                }
                return null;
            }),
        );
        return list.filter(item => item);
    } catch (e) {
        console.error(e);
        return [];
    }
};

// ========================================================
// Bond Info
// ========================================================
export interface iBondInfo {
    total_debt: number;
    total_purchased: number;
    last_update_time: number;
}

export const getBondInfo = async (tokenAddress: string) => {
    try {
        const result = await requestChain("state.get_resource", [CONTRACT_ADDRESS, `${CONTRACT_ADDRESS}::Bond::Info<${tokenAddress}>`, { decode: true }]);
        return (result?.data?.result?.json as iBondInfo) || {};
    } catch (e) {
        return e;
    }
};

// ========================================================
// Bond Price
// ========================================================
export const getBondPriceUSD = async (tokenAddress: string) => {
    try {
        // price * 10^18
        const result = await requestChain("contract.call_v2", [{ function_id: `${CONTRACT_ADDRESS}::Bond::bond_price_usd`, args: [], type_args: [tokenAddress] }]);
        return result.data?.result;
    } catch (e) {
        return e;
    }
};

// ========================================================
// Buy Bond
// ========================================================
export interface iBondBuyData {
    tokenAddress: string;
    amount: number;
    bond_price_usd: number;
    precision: number;
}

export const buyBondService = async ({ tokenAddress, amount, bond_price_usd = 100000000000000000000, precision }: iBondBuyData) => {
    return TxnWrapper({
        functionId: `${CONTRACT_ADDRESS}::MarketScript::buy_bond`,
        typeTag: [tokenAddress],
        // TODO: max_price
        params: [ToChainAmount(amount, precision), bond_price_usd],
    });
};

// ========================================================
// Redeem Bond
// ========================================================
export const claimRedeemBondService = async (tokenAddress: string) => {
    return TxnWrapper({
        functionId: `${CONTRACT_ADDRESS}::MarketScript::buy_bond`,
        typeTag: [tokenAddress],
        params: [],
    });
};

// ========================================================
// Stake
// ========================================================
export interface iStakeData {
    amount: number;
    precision: number;
}

export const stakeService = async ({ amount, precision }: iStakeData) => {
    return TxnWrapper({
        functionId: `${CONTRACT_ADDRESS}::MarketScript::stake`,
        typeTag: [],
        params: [ToChainAmount(amount, precision)],
    });
};

export const unStakeService = async ({ amount, precision }: iStakeData) => {
    return TxnWrapper({
        functionId: `${CONTRACT_ADDRESS}::MarketScript::unstake`,
        typeTag: [],
        params: [ToChainAmount(amount, precision)],
    });
};

// ========================================================
// Forfeit
// ========================================================
export const forfeitService = async () => {
    return TxnWrapper({
        functionId: `${CONTRACT_ADDRESS}::MarketScript::forfeit`,
        typeTag: [],
        params: [],
    });
};

// ========================================================
// Reward Ratio
// ========================================================
export const getRewardRatio = async () => {
    try {
        const result = await requestChain("contract.call_v2", [{ function_id: `${CONTRACT_ADDRESS}::Stake::next_reward_ratio`, args: [], type_args: [] }]);
        return result.data?.result || [0];
    } catch (e) {
        return e;
    }
};

// ========================================================
// Stake Pool
// ========================================================
export const getTotalValueDeposited = async () => {
    try {
        const result = await requestChain("state.get_resource", [CONTRACT_ADDRESS, `${CONTRACT_ADDRESS}::Stake::Pool`, { decode: true }]);
        return result.data?.result?.json?.token?.value || 0;
    } catch (e) {
        return e;
    }
};

// ========================================================
// Asset Pool
// ========================================================
export interface iAssetPoolData {
    [key: string]: number;
}

export const getAssetPool = async (bondList: iBondData[]) => {
    try {
        const values = await Promise.all(
            bondList.map(bond => requestChain("state.get_resource", [CONTRACT_ADDRESS, `${CONTRACT_ADDRESS}::Treasury::AssetPool<${bond.tokenAddress}>`, { decode: true }])),
        );
        const result: iAssetPoolData = {};
        bondList.forEach((bond, index) => {
            result[bond.name] = values[index].data?.result?.json?.asset?.value || 0;
        });
        return result;
    } catch (e) {
        return e;
    }
};
