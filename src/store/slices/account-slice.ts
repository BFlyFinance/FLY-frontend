import { ActionReducerMapBuilder, createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";

import { shortCutOfAccountHash } from "../../utils/index";
import { RootState } from "../index";
import { getUserStakedAndBond } from "../../utils/service";

export interface iAccountSlice {
    loading: boolean;
    address: string;
    short_address: string;
    stakedDetail: any;
    bondDetail: any;
    bondReleasedDetail: any;
}

const initialState: iAccountSlice = {
    loading: false,
    address: "",
    short_address: "",
    stakedDetail: null,
    bondDetail: null,
    bondReleasedDetail: null,
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
            window.localStorage.removeItem(WALLET_LS_KEY);
            return state;
        },
    },
    extraReducers: (builder: ActionReducerMapBuilder<iAccountSlice>) => {
        builder
            // getAccountFromWallet
            .addCase(getAccountFromWallet.pending, (state, actions) => {
                state.loading = false;
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
            // getAccountStaked
            .addCase(getAccountStakedAndBond.fulfilled, (state, actions) => {
                state = {
                    ...state,
                    ...(actions.payload as {}),
                };
            });
    },
});

const baseInfo = (state: RootState) => state.account;

export default accountSlice.reducer;

export const { emptyAddress } = accountSlice.actions;

export const getAddress = createSelector(baseInfo, account => account.address);
