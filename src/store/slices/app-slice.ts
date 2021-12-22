import axios from "axios";
import BigNumber from "bignumber.js";

import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";

import { CHAIN_NAME } from "../../utils";
import { RootState } from "../index";

export interface TokenPrice {
    [key: string]: string;
}

export interface iAppSlice {
    loading: boolean;
    tokenPrice: TokenPrice;
}

const initialState: iAppSlice = {
    loading: true,
    tokenPrice: {},
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

const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {},
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
            });
    },
});

export default appSlice.reducer;

const baseInfo = (state: RootState) => state.app;
export const getAppInfo = createSelector(baseInfo, app => app);
