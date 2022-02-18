import { useCallback, useState, useEffect } from "react";
import { useSnackbar } from "notistack";
import { buyBondService, claimRedeemBondService, GetTransactionStatus } from "../../utils/service";
import { iBondDialogData } from "../../components/FlyDialog/index";
import { useDispatch, useSelector } from "react-redux";
import { iReduxState } from "../../store/slices/state.interface";
import { iAppSlice } from "../../store/slices/app-slice";
import { getAccountStakedAndBond, iAccountSlice } from "../../store/slices/account-slice";
import { ToHumanAmount } from "../../utils";
import BigNumber from "bignumber.js";

export default () => {
    const dispatch = useDispatch();
    const appInfo = useSelector<iReduxState, iAppSlice>(state => state.app);
    const account = useSelector<iReduxState, iAccountSlice>(state => state.account);

    const [bondLoading, setBondLoading] = useState(false);
    const [bondAmount, setBondAmount] = useState<number | string>("");
    const [dialogData, setDialogData] = useState({} as iBondDialogData);
    // the balance of current dialog data token
    const [currentTokenBalance, setCurrentTokenBalance] = useState<number | string>("");
    const [bondDebtRatio, setBondDebtRatio] = useState<number | string>("");
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        // update current balance user has
        setCurrentTokenBalance(
            ToHumanAmount(account.bondTokenBalance[dialogData?.name?.toLowerCase()] || 0, appInfo?.tokenPrecision[dialogData?.name?.toLowerCase()]?.scale).toString(10),
        );
        // update ratio
        setBondDebtRatio(`${ToHumanAmount(dialogData.debtRatio, Math.pow(10, 18)).multipliedBy(100).dp(4).toString(10)}%`);
    }, [dialogData, account, appInfo]);

    const buyBond = async ({ tokenAddress, bond_price_usd = 0, name }: iBondDialogData) => {
        try {
            if (bondAmount !== 0 && bondAmount !== "") {
                if (bondAmount > currentTokenBalance) {
                    return enqueueSnackbar("Buy amount can not over your balance!", { variant: "error" });
                }

                setBondLoading(true);
                const tokenName = name.toLocaleLowerCase();

                const txn = await buyBondService({
                    tokenAddress,
                    precision: appInfo.tokenPrecision[tokenName]?.scale,
                    amount: Number(bondAmount),
                    bond_price_usd: new BigNumber(bond_price_usd).shiftedBy(18).toNumber(),
                });
                const currentTxnStatus = await GetTransactionStatus(txn);

                if (currentTxnStatus?.status === "Executed") {
                    enqueueSnackbar("Transaction Successed!", { variant: "success" });
                    setBondAmount("");
                } else if (typeof currentTxnStatus?.status === "object") {
                    enqueueSnackbar(`${txn} Transaction Faild!`, { variant: "error" });
                }
                setBondLoading(false);

                dispatch(getAccountStakedAndBond(account.address));
            } else {
                enqueueSnackbar("Please enter amount", { variant: "error" });
            }
        } catch (e: any) {
            setBondLoading(false);
            enqueueSnackbar(e.toString(), { variant: "error" });
        }
    };

    const claimRedeemBond = async ({ tokenAddress }: iBondDialogData) => {
        try {
            setBondLoading(true);
            const txn = await claimRedeemBondService(tokenAddress);

            const currentTxnStatus = await GetTransactionStatus(txn);

            if (currentTxnStatus?.status === "Executed") {
                enqueueSnackbar("Transaction Successed!", { variant: "success" });
                setBondAmount("");
            } else if (typeof currentTxnStatus?.status === "object") {
                enqueueSnackbar(`${txn} Transaction Faild!`, { variant: "error" });
            }
            setBondLoading(false);
            dispatch(getAccountStakedAndBond(account.address));
        } catch (e: any) {
            setBondLoading(false);
            enqueueSnackbar(e.toString(), { variant: "error" });
        }
    };

    const setMaxAmount = useCallback(() => {
        setBondAmount(currentTokenBalance);
    }, [currentTokenBalance]);

    return {
        bondLoading,
        bondAmount,
        currentTokenBalance,
        bondDebtRatio,
        dialogData,
        setDialogData,
        buyBond,
        claimRedeemBond,
        setBondAmount,
        setMaxAmount,
    };
};
