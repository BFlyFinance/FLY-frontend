import { CONTRACT_ADDRESS, requestChain, chainRpc, ToChainAmount } from "./index";
import TxnWrapper, { JsonProvider } from "./TxnWrapper";

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
// User Staked
// ========================================================
export const getUserStakedAndBond = async (address: string) => {
    try {
        const stakedResult = await requestChain("contract.get_resource", [address, `${CONTRACT_ADDRESS}::Stake::SFLY`]);
        const bondResult = await requestChain("contract.get_resource", [address, `${CONTRACT_ADDRESS}::Bond::Bond<0x00000000000000000000000000000001::STC::STC>`]);
        const bondReleasedRate = await requestChain("contract.get_resource", [address, `${CONTRACT_ADDRESS}::Bond::ReleasedRate`]);

        //TODO: 等有数据了这里要改成数据结构解析
        return {
            stakedDetail: {},
            bondDetail: {},
            bondReleasedDetail: {},
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
    max_price?: number;
    max_price_precision?: number;
    vesting_term?: number;
}

export const getBondList = async () => {
    try {
        const result: any = await requestChain("state.list_resource", [CONTRACT_ADDRESS, { decode: true }]);
        const { resources } = result?.data?.result;

        const list: iBondData[] = await Promise.all(
            Object.keys(resources).map(async key => {
                if (key.indexOf(`0x00000000000000000000000000000001::Config::Config<${CONTRACT_ADDRESS}::Config::BondConfig`) > -1) {
                    const { payload } = resources[key].json;
                    const tokenResult =
                        key.match(new RegExp(`0x00000000000000000000000000000001::Config::Config<0xc137657e5aed5099592ba07c8ab44cc5::Config::BondConfig<(.+)>>`)) || [];
                    let tokenAddress = "";

                    if (tokenResult?.length > 1) {
                        tokenAddress = tokenResult[1];
                    }

                    const [max_price, max_price_precision] = await getBondPrice(tokenAddress);

                    const matchResult = key.match(/.+(<.*?>).+/);
                    if (matchResult && matchResult.length > 1) {
                        const tokens = matchResult[1].replace(/[<>]/g, "").split(",");
                        const tokenNames = tokens.map(token => token.split("::").pop());

                        return {
                            tokens,
                            tokenAddress,
                            // FIXME: remove 100
                            max_price: max_price * 100,
                            max_price_precision,
                            name: `${tokenNames.join("-")}${tokens.length > 1 ? " LP" : ""}`,
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
export const getBondInfo = async () => {
    try {
        const result = await requestChain("state.get_resource", [
            CONTRACT_ADDRESS,
            `${CONTRACT_ADDRESS}::Bond::Info<0x00000000000000000000000000000001::STC::STC>`,
            { decode: true },
        ]);
        return result.data?.result;
    } catch (e) {
        return e;
    }
};

// ========================================================
// Bond Price
// ========================================================
export const getBondPrice = async (tokenAddress: string) => {
    try {
        const result = await requestChain("contract.call_v2", [{ function_id: `${CONTRACT_ADDRESS}::MarketScript::bond_price`, args: [], type_args: [tokenAddress] }]);
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
    max_price: number;
    percision: number;
}

export const buyBondService = async ({ tokenAddress, amount, max_price = 100000000000000000000, percision }: iBondBuyData) => {
    return TxnWrapper({
        functionId: `${CONTRACT_ADDRESS}::MarketScript::buy_bond`,
        typeTag: [tokenAddress],
        // TODO: max_price
        params: [ToChainAmount(amount, percision), max_price],
    });
};

// ========================================================
// Stake
// ========================================================
export const stakeService = async (amount: number, percision: number) => {
    return TxnWrapper({
        functionId: `${CONTRACT_ADDRESS}::MarketScript::stake`,
        typeTag: [],
        params: [ToChainAmount(amount, percision)],
    });
};
