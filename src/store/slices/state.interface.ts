import { IAccountSlice } from "./account-slice";
import { iAppSlice } from "./app-slice";

export interface iReduxState {
    account: IAccountSlice;
    app: iAppSlice;
}
