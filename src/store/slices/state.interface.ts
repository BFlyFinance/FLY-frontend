import { iAccountSlice } from "./account-slice";
import { iAppSlice } from "./app-slice";

export interface iReduxState {
    account: iAccountSlice;
    app: iAppSlice;
}
