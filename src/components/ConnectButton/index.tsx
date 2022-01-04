import { WALLET_LS_KEY, emptyAddress, getAccountFromWallet, getAccountStakedAndBond, iAccountSlice } from "../../store/slices/account-slice";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "@mui/material";
import { CustomButton } from "../../constants/assets/button";
import { iReduxState } from "../../store/slices/state.interface";

const DEFAULT_BUTTON_TEXT = "Connect Wallet";

const ConnectButton = () => {
    const account = useSelector<iReduxState, iAccountSlice>(state => state.account);
    const dispatch = useDispatch();

    const [buttonText, setButtonText] = useState(DEFAULT_BUTTON_TEXT);

    const connect = useCallback(
        (init: boolean = false) => {
            if (account.loading) return;

            if (!account.short_address || init) {
                dispatch(getAccountFromWallet());
            } else {
                // dispatch(emptyAddress());
            }
        },
        [account],
    );

    const getAccountStakedInfo = useCallback(async () => {
        if (account.address) {
            dispatch(getAccountStakedAndBond(account.address));
        }
    }, [account.address]);

    // first Init
    useEffect(() => {
        if (window.localStorage.getItem(WALLET_LS_KEY)) {
            connect(true);
        }
        getAccountStakedInfo();
    }, []);

    useEffect(() => {
        setButtonText(account.short_address || DEFAULT_BUTTON_TEXT);
        getAccountStakedInfo();
    }, [account.short_address]);

    return (
        <Button sx={CustomButton} onClick={() => connect()}>
            {buttonText}
        </Button>
    );
};

export default ConnectButton;
