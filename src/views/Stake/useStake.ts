import { GetTransactionStatus, getUserFLYBalance, stakeService, unStakeService, getRewardRatio, getTotalValueDeposited } from "../../utils/service";
import { getAccountStakedAndBond, iAccountSlice } from "../../store/slices/account-slice";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import BigNumber from "bignumber.js";
import { ToHumanAmount } from "../../utils/index";
import { iAppSlice } from "../../store/slices/app-slice";
import { iReduxState } from "../../store/slices/state.interface";
import { useSnackbar } from "notistack";

export default () => {
    const appInfo = useSelector<iReduxState, iAppSlice>(state => state.app);
    const account = useSelector<iReduxState, iAccountSlice>(state => state.account);
    const dispatch = useDispatch();

    const [stakeLoading, setStakeLoading] = useState(false);
    const [stakeAmount, setStakeAmount] = useState<number | string>("");
    const [balance, setBalance] = useState<number | string>("");
    const [stakedBalance, setStakedBalance] = useState("0");
    const [stakedROI5days, setStakedROI5days] = useState<number | string>("0");
    const [apy, setApy] = useState(0);
    const [tvl, setTvl] = useState(0);

    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        (async () => {
            const [ratio] = await getRewardRatio();
            const realRatio = new BigNumber(ratio).dividedBy(1e18);

            // set APY
            setApy(
                new BigNumber(1)
                    .plus(realRatio)
                    .exponentiatedBy(3 * 365)
                    .multipliedBy(100)
                    .dp(2)
                    .toNumber(),
            );

            // Set 5 days roi
            setStakedROI5days(
                new BigNumber(1)
                    .plus(realRatio)
                    .exponentiatedBy(3 * 5)
                    .multipliedBy(100)
                    .dp(4)
                    .toNumber(),
            );

            const totalValueDeposited = await getTotalValueDeposited();
            setTvl(totalValueDeposited * 1);
        })();
    }, []);

    const getUserFLYBalanceCallback = useCallback(() => {
        (async () => {
            const balance = await getUserFLYBalance(account.address);
            setBalance(ToHumanAmount(balance, appInfo?.tokenPrecision["fly"]?.scale).valueOf());
        })();
    }, [appInfo.tokenPrecision]);

    useEffect(() => {
        if (account.address) {
            getUserFLYBalanceCallback();
        }
    }, [account.address, getUserFLYBalanceCallback]);

    useEffect(() => {
        setStakedBalance(
            ToHumanAmount(new BigNumber(account?.stakedDetail?.warmup_amount || 0).plus(account.stakedDetail?.amount || 0).toNumber(), appInfo.tokenPrecision["fly"]?.scale)
                // TODO: replace to fly price
                .multipliedBy(1)
                .valueOf(),
        );
    }, [account.stakedDetail, account.address]);

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
                const txn = await stakeService({ amount: new BigNumber(stakeAmount).toNumber(), precision: appInfo.tokenPrecision[tokenName]?.scale });
                const currentTxnStatus = await GetTransactionStatus(txn);

                if (currentTxnStatus?.status === "Executed") {
                    enqueueSnackbar("Transaction Successed!", { variant: "success" });
                    setStakeAmount("");
                } else if (typeof currentTxnStatus?.status === "object") {
                    enqueueSnackbar(`${txn} Transaction Faild!`, { variant: "error" });
                }
                setStakeLoading(false);
                // update account info
                getUserFLYBalanceCallback();
                dispatch(getAccountStakedAndBond(account.address));
            } else {
                enqueueSnackbar("Please enter amount", { variant: "error" });
            }
        } catch (e: any) {
            setStakeLoading(false);
            enqueueSnackbar(e.toString(), { variant: "error" });
        }
    };

    const unStakeToken = async (name: string) => {
        try {
            if (stakeAmount !== 0 && stakeAmount !== "") {
                setStakeLoading(true);

                const tokenName = name.toLocaleLowerCase();
                const txn = await unStakeService({ amount: new BigNumber(stakeAmount).toNumber(), precision: appInfo.tokenPrecision[tokenName]?.scale });
                const currentTxnStatus = await GetTransactionStatus(txn);

                if (currentTxnStatus?.status === "Executed") {
                    enqueueSnackbar("Transaction Successed!", { variant: "success" });
                    setStakeAmount("");
                } else if (typeof currentTxnStatus?.status === "object") {
                    enqueueSnackbar(`${txn} Transaction Faild!`, { variant: "error" });
                }
                setStakeLoading(false);
                // update account info
                getUserFLYBalanceCallback();
                dispatch(getAccountStakedAndBond(account.address));
            }
        } catch (e: any) {
            setStakeLoading(false);
            enqueueSnackbar(e.toString(), { variant: "error" });
        }
    };

    return {
        apy,
        tvl,
        balance,
        stakeLoading,
        stakeAmount,
        stakedBalance,
        stakedROI5days,
        setStakedROI5days,
        stakeToken,
        unStakeToken,
        setStakeAmount,
        setUnStakeMaxAmount,
        setMaxAmount,
    };
};
