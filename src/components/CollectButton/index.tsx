import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { emptyAddress, getAccountFromWallet, IAccountSlice, WALLET_LS_KEY } from "../../store/slices/account-slice";
import { iReduxState } from "../../store/slices/state.interface";

const DEFAULT_BUTTON_TEXT = "Connect Wallet";

const CollectButton = () => {
    const account = useSelector<iReduxState, IAccountSlice>(state => state.account);
    const dispatch = useDispatch();

    const [buttonText, setButtonText] = useState(DEFAULT_BUTTON_TEXT);

    const connect = useCallback(() => {
        if (account.loading) return;
        if (!account.short_address) {
            dispatch(getAccountFromWallet());
        } else {
            dispatch(emptyAddress());
        }
    }, [account]);

    useEffect(() => {
        if (window.localStorage.getItem(WALLET_LS_KEY)) {
            connect();
        }
    }, []);

    useEffect(() => {
        setButtonText(account.short_address || DEFAULT_BUTTON_TEXT);
    }, [account]);

    return (
        <div className="button" onClick={connect}>
            {buttonText}
        </div>
    );
};

export default CollectButton;
