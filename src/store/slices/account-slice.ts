import { ActionReducerMapBuilder, createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";

import { shortCutOfAccountHash } from "../../utils/index";
import { getUserStakedAndBond } from "../../utils/service";
import { RootState } from "../index";

export interface iStakeDetail {
    amount: number;
    index: number;
    index_last_update: number;
    warmup_amount: number;
    warmup_expires: number;
}

export interface iBondDetail {
    last_time: number;
    payout: number;
    price_paid: number;
    start_time: number;
    vesting_percent: number;
    token: {
        [key: string]: any;
    };
    vesting: number;
}

export interface iAccountSlice {
    loading: boolean;
    address: string;
    short_address: string;
    bondTokenBalance: { [key: string]: number };
    stakedDetail: iStakeDetail;
    bondDetail: { [key: string]: iBondDetail };
    bondReleasedDetail: any;
}

const initialState: iAccountSlice = {
    loading: false,
    address: "",
    short_address: "",
    bondTokenBalance: {},
    stakedDetail: {} as iStakeDetail,
    bondDetail: {} as { [key: string]: iBondDetail },
    bondReleasedDetail: {},
};

export const getAccountFromWallet = createAsyncThunk("account/getAccountFromWallet", async () => {
    try {
        const res = await window.starcoin.request({
            method: "stc_requestAccounts",
        });
        return res[0];
    } catch (err) {
        console.log(err);
    }
});

export const getAccountStakedAndBond = createAsyncThunk("account/getAccountStaked", async (address: string) => {
    try {
        return await getUserStakedAndBond(address);
    } catch (err) {
        console.log(err);
    }
});

export const WALLET_LS_KEY = "wallet-stc-fly";

const accountSlice = createSlice({
    name: "account",
    initialState,
    reducers: {
        emptyAddress(state: iAccountSlice) {
            state.address = "";
            state.short_address = "";
            // window.localStorage.removeItem(WALLET_LS_KEY);
            return state;
        },
    },
    extraReducers: (builder: ActionReducerMapBuilder<iAccountSlice>) => {
        builder
            // getAccountFromWallet
            .addCase(getAccountFromWallet.pending, state => {
                state.loading = true;
            })
            .addCase(getAccountFromWallet.rejected, (state, actions) => {
                state.loading = false;
                console.log(actions.error);
            })
            .addCase(getAccountFromWallet.fulfilled, (state, actions) => {
                state.loading = false;
                state.address = actions.payload;
                state.short_address = shortCutOfAccountHash(state.address);
                window.localStorage.setItem(WALLET_LS_KEY, "1");
            })
            .addCase(getAccountStakedAndBond.pending, state => {
                state.loading = true;
            })
            .addCase(getAccountStakedAndBond.rejected, state => {
                state.loading = false;
            })
            .addCase(getAccountStakedAndBond.fulfilled, (state, actions) => {
                state.loading = false;
                console.log(actions.payload);
                Object.assign(state, actions.payload as {});
            });
    },
});

const baseInfo = (state: RootState) => state.account;

export default accountSlice.reducer;

export const { emptyAddress } = accountSlice.actions;

export const getAddress = createSelector(baseInfo, account => account.address);
