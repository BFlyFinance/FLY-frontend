import { CONTRACT_ADDRESS, requestChain, chainRpc, ToChainAmount } from "./index";
import TxnWrapper from "./TxnWrapper";

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
}

export const getBondList = async () => {
    try {
        const result: any = await requestChain("state.list_resource", [CONTRACT_ADDRESS, { decode: true }]);
        const { resources } = result?.data?.result;
        const bondList: iBondData[] = [];
        Object.keys(resources).forEach(key => {
            if (key.indexOf(`0x00000000000000000000000000000001::Config::Config<${CONTRACT_ADDRESS}::Config::BondConfig`) > -1) {
                const { payload } = resources[key].json;
                const matchResult = key.match(/.+(<.*?>).+/);
                if (matchResult && matchResult.length > 1) {
                    const tokens = matchResult[1].replace(/[<>]/g, "").split(",");
                    const tokenNames = tokens.map(token => token.split("::").pop());

                    bondList.push({
                        name: `${tokenNames.join("-")} ${tokens.length > 1 ? "LP" : ""}`,
                        tokens,
                        ...payload,
                    });
                }
            }
        });
        console.log(bondList);
        return bondList;
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
export const getBondPrice = async () => {
    try {
        const result = await requestChain("contract.call_v2", [{ function_id: `${CONTRACT_ADDRESS}::MarketScript::bond_price`, args: [], type_args: ["0x1::STC::STC"] }]);
        return result.data?.result;
    } catch (e) {
        return e;
    }
};

// ========================================================
// Stake
// ========================================================
export const stakeService = async (amount: number) => {
    return TxnWrapper({
        functionId: `${CONTRACT_ADDRESS}::MarketScript::stake`,
        typeTag: [],
        params: [ToChainAmount(amount)],
    });
};
