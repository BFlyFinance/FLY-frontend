import axios from "axios";
import BigNumber from "bignumber.js";

import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";

import { CHAIN_NAME } from "../../utils";
import { RootState } from "../index";
import { requestChain, TOEKN_FLY, TOKEN_STC } from "../../utils/index";

export interface TokenPrice {
    [key: string]: string;
}

interface TokenPersicion {
    scale: number;
    percision: number;
}
export interface iAppSlice {
    loading: boolean;
    tokenPrice: TokenPrice;
    marketIndex: number | null;
    tokenPersicon: {
        [key: string]: TokenPersicion;
    };
}

const initialState: iAppSlice = {
    loading: true,
    tokenPrice: {},
    marketIndex: null,
    tokenPersicon: {
        fly: {
            scale: 100000000,
            percision: 9,
        },
        stc: {
            scale: 100000000,
            percision: 9,
        },
    },
};

export const getOracle = createAsyncThunk("app/getOracle", async () => {
    try {
        const res = await axios.get(`https://price-api.starcoin.org/${CHAIN_NAME["251"]}/v1/priceFeeds`);
        const result: TokenPrice = {};

        res.data
            .filter((oracle: any) => ["BTC / USD", "ETH / USD", "STC / USD"].includes(oracle.pairName))
            .forEach((oracle: any) => {
                const name = oracle.pairName.split(" ")[0];
                result[name === "STC" ? name : `M${name}`] = new BigNumber(oracle.latestPrice).shiftedBy(-1 * oracle.decimals).valueOf();
            });

        result["MUSDT"] = "1";
        return result;
    } catch (err) {
        console.log(err);
    }
});

interface TokenPriceMap {
    [key: string]: number;
}

export const getFlyTokenPrice = createAsyncThunk("app/getFlyTokenPrice", async () => {
    try {
        const flyResult = await requestChain("contract.call_v2", [{ function_id: "0x1::Token::scaling_factor", type_args: [TOEKN_FLY], args: [] }]);
        const stcResult = await requestChain("contract.call_v2", [{ function_id: "0x1::Token::scaling_factor", type_args: [TOKEN_STC], args: [] }]);

        return {
            stc: stcResult?.data?.result?.[0],
            fly: flyResult?.data?.result?.[0],
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
            .addCase(getFlyTokenPrice.fulfilled, (state, actions) => {
                const payload: TokenPriceMap = actions.payload as TokenPriceMap;

                Object.keys(payload).forEach(key => {
                    state.tokenPersicon[key] = {
                        scale: payload[key] as number,
                        percision: Math.floor(Math.log10(payload[key] as number)),
                    };
                });
            });
    },
});

export default appSlice.reducer;

export const { setMarketIndex } = appSlice.actions;

const baseInfo = (state: RootState) => state.app;
export const getAppInfo = createSelector(baseInfo, app => app);
