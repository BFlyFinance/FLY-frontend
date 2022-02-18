import {
    CONTRACT_ADDRESS,
    KEY_Balance,
    TOKEN_FLY,
    ToChainAmount,
    chainRpc,
    requestChain,
    resultDesc,
    TOKEN_FAI,
    TOKEN_STC,
    TOKEN_FLY_FAI,
    TOKEN_FLY_STC,
    ToHumanAmount,
    FLY_PRICE_USD,
    TOKEN_FAI_FLY,
} from "./index";
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
// User FLY Balance
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
// User Balances for Bond trade
// ========================================================
export const getUserBalancesForBondTrade = async (address: string) => {
    try {
        const faiResult = resultDesc(await requestChain("state.get_resource", [address, KEY_Balance(TOKEN_FAI), { decode: true }]));
        const stcResult = resultDesc(await requestChain("state.get_resource", [address, KEY_Balance(TOKEN_STC), { decode: true }]));
        const flyFaiResult = resultDesc(await requestChain("state.get_resource", [address, KEY_Balance(TOKEN_FLY_FAI), { decode: true }]));
        const faiflyResult = resultDesc(await requestChain("state.get_resource", [address, KEY_Balance(TOKEN_FAI_FLY), { decode: true }]));
        const flySTCResult = resultDesc(await requestChain("state.get_resource", [address, KEY_Balance(TOKEN_FLY_STC), { decode: true }]));

        return {
            fai: faiResult?.token?.value || 0,
            stc: stcResult?.token?.value || 0,
            "fly-fai lp": flyFaiResult?.token?.value || 0,
            "fai-fly lp": faiflyResult?.token?.value || 0,
            "fly-stc lp": flySTCResult?.token?.value || 0,
        };
    } catch (e) {
        console.log(e);
        return [];
    }
};

// ========================================================
// User Bond Info
// ========================================================
export const getUserBondInfo = async (address: string, tokenAddress: string) => {
    try {
        const bondInfo = resultDesc(await requestChain("state.get_resource", [address, `${CONTRACT_ADDRESS}::Bond::Bond<${tokenAddress}>`, { decode: true }])) as iBondDetail;
        if (bondInfo) {
            const vestingPercent = await getUserBondVesting(address, tokenAddress);
            bondInfo["vesting_percent"] = vestingPercent;
        }
        return bondInfo || null;
    } catch (e) {
        console.log(e);
        return null;
    }
};

// ========================================================
// User Bond Vesting
// ========================================================

export const getUserBondVesting = async (address: string, tokenAddress: string) => {
    try {
        const result = await requestChain("contract.call_v2", [
            {
                function_id: `${CONTRACT_ADDRESS}::Bond::percent_vested`,
                type_args: [tokenAddress],
                args: [address],
            },
        ]);

        return result.data?.result ? ToHumanAmount(result.data.result, Math.pow(10, 18)).dp(4).toNumber() : 0;
    } catch (e) {
        console.log(e);
        return 0;
    }
};

// ========================================================
// User Staked
// ========================================================
export const getUserStakedAndBond = async (address: string) => {
    try {
        const stakedDetail = resultDesc(await requestChain("state.get_resource", [address, `${CONTRACT_ADDRESS}::Stake::SFLY`, { decode: true }])) as iStakeDetail;
        const bondDetail = {
            stc: await getUserBondInfo(address, TOKEN_STC),
            fai: await getUserBondInfo(address, TOKEN_FAI),
            "fly-stc lp": await getUserBondInfo(address, TOKEN_FLY_STC),
            "fly-fai lp": await getUserBondInfo(address, TOKEN_FLY_FAI),
            "fai-fly lp": await getUserBondInfo(address, TOKEN_FAI_FLY),
        };

        // token balance in address wallet
        const bondTokenBalance = await getUserBalancesForBondTrade(address);

        const bondReleasedDetail = resultDesc(await requestChain("state.get_resource", [address, `${CONTRACT_ADDRESS}::Bond::ReleasedRate`, { decode: true }]));

        return {
            stakedDetail,
            bondDetail,
            bondTokenBalance,
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
    debtRatio: number;
    tokens?: string[];
    vesting_term?: number;
    total_purchased: number;
    bond_price_usd?: number;
    max_debt: number;
    roi: {
        (oracle_price_fly: number): BigNumber;
    };
    purchased: {
        (oracle_price_lp: number): BigNumber;
    };
}

interface iRoiCalcuData {
    bond_price_usd: string | number | BigNumber;
    oracle_price_fly: string | number | BigNumber;
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

                    const [bond_price_usd_big] = (await getBondPriceUSD(tokenAddress)) || [];
                    // bond_price needs shiftedBy
                    const bond_price_usd = new BigNumber(bond_price_usd_big).shiftedBy(-18).toNumber();
                    // Bond Info
                    const { total_debt, total_purchased, last_update_time } = (await getBondInfo(tokenAddress)) as iBondInfo;

                    const debtRatio = (await getBondDebtRatio(tokenAddress)) || 0;
                    // Does user have this bond?
                    // Bond versting percent

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
                            debtRatio,
                            name: `${tokenNames.join("-")}${tokens.length > 1 ? " LP" : ""}`,
                            roi: (oracle_price_fly: number) =>
                                ROICalcu({
                                    bond_price_usd,
                                    oracle_price_fly: new BigNumber(oracle_price_fly),
                                } as iRoiCalcuData),
                            purchased: (oracle_price_lp: number) => {
                                return new BigNumber(total_purchased).times(bond_price_usd || 0);
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
// FLY price
// ========================================================
export const getFlyPrice = async () => {
    try {
        const result = await requestChain("contract.call_v2", [{ function_id: "0x1::PriceOracle::read", args: [CONTRACT_ADDRESS], type_args: [FLY_PRICE_USD] }]);
        return result.data?.result ? result.data?.result[0] || 0 : 0;
    } catch (e) {
        console.log(e);
        return 0;
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
// Bond Debt Ratio
// ========================================================
export const getBondDebtRatio = async (tokenAddress: string) => {
    try {
        const result = await requestChain("contract.call_v2", [{ function_id: `${CONTRACT_ADDRESS}::MarketScript::debt_ratio`, args: [], type_args: [tokenAddress] }]);
        return result.data?.result ? result.data?.result[0] || 0 : 0;
    } catch (e) {
        console.log(e);
        return 0;
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
        params: [ToChainAmount(amount, precision).toNumber(), bond_price_usd],
    });
};

// ========================================================
// Redeem Bond
// ========================================================
export const claimRedeemBondService = async (tokenAddress: string) => {
    return TxnWrapper({
        functionId: `${CONTRACT_ADDRESS}::MarketScript::redeem`,
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
