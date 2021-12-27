import BigNumber from "bignumber.js";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { iAppSlice } from "../../store/slices/app-slice";
import { iReduxState } from "../../store/slices/state.interface";
import { ToHumanAmount } from "../../utils/index";
import { GetTransactionStatus, getUserFLYBalance, stakeService } from "../../utils/service";
import { iAccountSlice, getAccountStakedAndBond } from "../../store/slices/account-slice";

export default () => {
    const appInfo = useSelector<iReduxState, iAppSlice>(state => state.app);
    const account = useSelector<iReduxState, iAccountSlice>(state => state.account);
    const dispatch = useDispatch();

    const [stakeLoading, setStakeLoading] = useState(false);
    const [stakeAmount, setStakeAmount] = useState<number | string>("");
    const [balance, setBalance] = useState("0");
    const [stakedBalance, setStakedBalance] = useState("0");

    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (account.address) {
            (async () => {
                const balance = await getUserFLYBalance(account.address);
                setBalance(ToHumanAmount(balance, appInfo?.tokenPrecision["fly"]?.scale).valueOf());
            })();

            console.log("account.stakedDetail?.warmup_amount", account?.stakedDetail?.warmup_amount, "account.stakedDetail?.amount", account.stakedDetail?.amount);

            setStakedBalance(
                ToHumanAmount(
                    new BigNumber(account?.stakedDetail?.warmup_amount || 0).plus(account.stakedDetail?.amount || 0).toNumber(),
                    appInfo.tokenPrecision["fly"]?.scale,
                ).toString(),
            );
        }
    }, [account.address, appInfo.tokenPrecision]);

    const setMaxAmount = useCallback(() => {
        setStakeAmount(balance);
    }, [balance]);

    const setUnStakeMaxAmount = useCallback(() => {
        setStakeAmount(stakedBalance);
    }, [stakedBalance]);

    const stakeToken = async (name: string) => {
        try {
            if (stakeAmount !== 0 && stakeAmount !== "") {
                setStakeLoading(true);

                const tokenName = name.toLocaleLowerCase();
                const txn = await stakeService(Number(stakeAmount), appInfo.tokenPrecision[tokenName]?.scale);
                const currentTxnStatus = await GetTransactionStatus(txn);

                if (currentTxnStatus?.status === "Executed") {
                    enqueueSnackbar("Transaction Successed!", { variant: "success" });
                    setStakeAmount("");
                } else if (typeof currentTxnStatus?.status === "object") {
                    enqueueSnackbar(`${txn} Transaction Faild!`, { variant: "error" });
                }
                setStakeLoading(false);
                // update account info
                dispatch(getAccountStakedAndBond(account.address));
            } else {
                enqueueSnackbar("Please enter amount", { variant: "error" });
            }
        } catch (e: any) {
            setStakeLoading(false);
            enqueueSnackbar(e.toString(), { variant: "error" });
        }
    };

    return {
        balance,
        stakeLoading,
        stakeAmount,
        stakedBalance,
        stakeToken,
        setStakeAmount,
        setUnStakeMaxAmount,
        setMaxAmount,
    };
};
