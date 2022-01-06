import { GetTransactionStatus, getUserFLYBalance, stakeService, forfeitService, unStakeService, getRewardRatio, getTotalValueDeposited } from "../../utils/service";
import { getAccountStakedAndBond, iAccountSlice } from "../../store/slices/account-slice";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import BigNumber from "bignumber.js";
import { ToHumanAmount } from "../../utils/index";
import { iAppSlice } from "../../store/slices/app-slice";
import { iReduxState } from "../../store/slices/state.interface";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";

export default () => {
    const appInfo = useSelector<iReduxState, iAppSlice>(state => state.app);
    const account = useSelector<iReduxState, iAccountSlice>(state => state.account);
    const dispatch = useDispatch();

    const [stakeLoading, setStakeLoading] = useState(false);
    const [forfeiLoading, setForfeiLoading] = useState(false);
    const [stakeInputAmount, setStakeInputAmount] = useState<number | string>("");
    const [balance, setBalance] = useState<number | string>("");
    const [stakedBalance, setStakedBalance] = useState("0");
    const [wramupBalance, setWramupBalance] = useState<number | string>("");
    const [isWramupExpired, setIsWramupExpired] = useState(false);
    const [wramupDuration, setWramupDuration] = useState("");
    const [stakedROI5days, setStakedROI5days] = useState<number | string>("0");

    const [apy, setApy] = useState(0);
    const [tvd, setTvD] = useState(0);

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
            // TODO: update multiple price of fly
            setTvD(ToHumanAmount(totalValueDeposited, appInfo?.tokenPrecision["fly"]?.scale).multipliedBy(1).dp(2).toNumber());
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
        setIsWramupExpired(dayjs().isBefore(account.stakedDetail?.warmup_expires * 1000));

        // If wramup expired then staked balance = amount + wramup_amount
        if (!isWramupExpired) {
            setStakedBalance(
                ToHumanAmount(new BigNumber(account.stakedDetail?.amount || 0).toNumber(), appInfo.tokenPrecision["fly"]?.scale)
                    // TODO: replace to fly price
                    .multipliedBy(1)
                    .valueOf(),
            );
            if (!!account.stakedDetail?.warmup_expires) {
                setWramupDuration(`(Expired At: ${dayjs(account.stakedDetail?.warmup_expires * 1000).format("YYYY-MM-DD HH:mm:ss")})`);
            }
        } else {
            setStakedBalance(
                ToHumanAmount(new BigNumber(account?.stakedDetail?.warmup_amount || 0).plus(account.stakedDetail?.amount || 0).toNumber(), appInfo.tokenPrecision["fly"]?.scale)
                    // TODO: replace to fly price
                    .multipliedBy(1)
                    .valueOf(),
            );
            setWramupDuration("");
        }

        setWramupBalance(ToHumanAmount(account.stakedDetail?.warmup_amount || 0, appInfo.tokenPrecision["fly"]?.scale).valueOf());
    }, [account.stakedDetail, account.address]);

    const setMaxAmount = useCallback(() => {
        setStakeInputAmount(balance);
    }, [balance]);

    const setUnStakeMaxAmount = useCallback(() => {
        // Only set staked amount without wramup amount
        setStakeInputAmount(ToHumanAmount(account?.stakedDetail?.amount || 0, appInfo.tokenPrecision["fly"]?.scale).valueOf());
    }, [stakedBalance]);

    const stakeToken = async (name: string) => {
        try {
            if (stakeInputAmount !== 0 && stakeInputAmount !== "") {
                setStakeLoading(true);

                const tokenName = name.toLocaleLowerCase();
                const txn = await stakeService({ amount: new BigNumber(stakeInputAmount).toNumber(), precision: appInfo.tokenPrecision[tokenName]?.scale });
                const currentTxnStatus = await GetTransactionStatus(txn);

                if (currentTxnStatus?.status === "Executed") {
                    enqueueSnackbar("Transaction Successed!", { variant: "success" });
                    setStakeInputAmount("");
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
            if (stakeInputAmount !== 0 && stakeInputAmount !== "") {
                setStakeLoading(true);

                const tokenName = name.toLocaleLowerCase();
                const txn = await unStakeService({ amount: new BigNumber(stakeInputAmount).toNumber(), precision: appInfo.tokenPrecision[tokenName]?.scale });
                const currentTxnStatus = await GetTransactionStatus(txn);

                if (currentTxnStatus?.status === "Executed") {
                    enqueueSnackbar("Transaction Successed!", { variant: "success" });
                    setStakeInputAmount("");
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

    const forfeitToken = async () => {
        setForfeiLoading(true);
        setStakeLoading(true);
        try {
            const txn = await forfeitService();
            const currentTxnStatus = await GetTransactionStatus(txn);
            if (currentTxnStatus?.status === "Executed") {
                enqueueSnackbar("Transaction Successed!", { variant: "success" });
            } else if (typeof currentTxnStatus?.status === "object") {
                enqueueSnackbar(`${txn} Transaction Faild!`, { variant: "error" });
            }

            getUserFLYBalanceCallback();
            dispatch(getAccountStakedAndBond(account.address));
        } catch (e: any) {
            enqueueSnackbar(e.toString(), { variant: "error" });
        }
        setForfeiLoading(false);
        setStakeLoading(false);
    };

    return {
        apy,
        tvd,
        balance,
        stakeLoading,
        forfeiLoading,
        stakeInputAmount,
        wramupBalance,
        stakedBalance,
        stakedROI5days,
        isWramupExpired,
        wramupDuration,

        setStakedROI5days,
        stakeToken,
        unStakeToken,
        forfeitToken,
        setStakeInputAmount,
        setUnStakeMaxAmount,
        setMaxAmount,
    };
};
