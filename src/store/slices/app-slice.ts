import axios from "axios";
import BigNumber from "bignumber.js";

import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";

import { requestChain, TOKEN_FLY, CHAIN_NAME, TOKEN_FAI, TOKEN_FLY_FAI, TOKEN_FLY_STC, TOKEN_STC } from "../../utils/index";
import { RootState } from "../index";
import { getBondDebtRatio, getFlyPrice } from "../../utils/service";

export interface TokenPrice {
    [key: string]: string;
}

export interface BondDebtRatio {
    [key: string]: number;
}

interface TokenPersicion {
    scale: number;
    precision: number;
}
export interface iAppSlice {
    loading: boolean;
    tokenPrice: TokenPrice;
    bondDebtRatio: BondDebtRatio;
    marketIndex: number | null;
    tokenPrecision: {
        [key: string]: TokenPersicion;
    };
}

const initialState: iAppSlice = {
    loading: true,
    tokenPrice: {},
    bondDebtRatio: {},
    marketIndex: null,
    tokenPrecision: {
        fly: {
            scale: 1000000000,
            precision: 9,
        },
        stc: {
            scale: 1000000000,
            precision: 9,
        },
        "fai-fly lp": {
            scale: 1e18,
            precision: 18,
        },
    },
};

export const getOracle = createAsyncThunk("app/getOracle", async () => {
    try {
        const res = await axios.get(`https://price-api.starcoin.org/${CHAIN_NAME[251]}/v1/priceFeeds`);
        const result: TokenPrice = {};

        res.data
            .filter((oracle: any) => ["BTC / USD", "ETH / USD", "STC / USD"].includes(oracle.pairName))
            .forEach((oracle: any) => {
                const name = oracle.pairName.split(" ")[0];
                result[name === "STC" ? name : `M${name}`] = new BigNumber(oracle.latestPrice).shiftedBy(-1 * oracle.decimals).valueOf();
            });

        result["MUSDT"] = "1";
        result["FLY"] = new BigNumber((await getFlyPrice()) || 0).shiftedBy(-5).valueOf();

        return result;
    } catch (err) {
        console.log(err);
    }
});

interface TokenPriceMap {
    [key: string]: number;
}

export const getTokenPrecision = createAsyncThunk("app/getTokenPrecision", async () => {
    try {
        const flyResult = await requestChain("contract.call_v2", [{ function_id: "0x1::Token::scaling_factor", type_args: [TOKEN_FLY], args: [] }]);
        const stcResult = await requestChain("contract.call_v2", [{ function_id: "0x1::Token::scaling_factor", type_args: [TOKEN_STC], args: [] }]);
        const flyFaiResult = await requestChain("contract.call_v2", [
            {
                function_id: "0x1::Token::scaling_factor",
                type_args: [TOKEN_FLY_FAI],
                args: [],
            },
        ]);
        const flyStcResult = await requestChain("contract.call_v2", [
            {
                function_id: "0x1::Token::scaling_factor",
                type_args: [TOKEN_FLY_STC],
                args: [],
            },
        ]);
        return {
            stc: stcResult?.data?.result?.[0],
            fly: flyResult?.data?.result?.[0],
            "fly-fai lp": flyFaiResult?.data?.result?.[0],
            "fly-stc lp": flyStcResult?.data?.result?.[0],
        } as TokenPriceMap;
    } catch (err) {
        console.log(err);
    }
});

const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        setMarketIndex: (state: iAppSlice, action) => {
            state.marketIndex = action.payload;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getOracle.pending, (state, actions) => {
                state.loading = false;
            })
            .addCase(getOracle.rejected, (state, actions) => {
                state.loading = false;
                console.log(actions.error);
            })
            .addCase(getOracle.fulfilled, (state, actions) => {
                state.loading = false;
                state.tokenPrice = actions.payload as TokenPrice;
            })
            .addCase(getTokenPrecision.fulfilled, (state, actions) => {
                const payload: TokenPriceMap = actions.payload as TokenPriceMap;

                Object.keys(payload).forEach(key => {
                    state.tokenPrecision[key] = {
                        scale: payload[key] as number,
                        precision: Math.floor(Math.log10(payload[key] as number)),
                    };
                });
            });
    },
});

export default appSlice.reducer;

export const { setMarketIndex } = appSlice.actions;

const baseInfo = (state: RootState) => state.app;
export const getAppInfo = createSelector(baseInfo, app => app);
