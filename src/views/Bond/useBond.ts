import { useCallback, useState, useEffect } from "react";
import { useSnackbar } from "notistack";
import { buyBondService, claimRedeemBondService, GetTransactionStatus } from "../../utils/service";
import { iBondDialogData } from "../../components/FlyDialog/index";
import { useSelector } from "react-redux";
import { iReduxState } from "../../store/slices/state.interface";
import { iAppSlice } from "../../store/slices/app-slice";

export default () => {
    const appInfo = useSelector<iReduxState, iAppSlice>(state => state.app);
    const [bondLoading, setBondLoading] = useState(false);
    const [bondAmount, setBondAmount] = useState<number | string>("");
    const { enqueueSnackbar } = useSnackbar();

    const buyBond = async ({ tokenAddress, bond_price_usd = 0, name }: iBondDialogData) => {
        try {
            if (bondAmount !== 0 && bondAmount !== "") {
                setBondLoading(true);
                const tokenName = name.toLocaleLowerCase();

                const txn = await buyBondService({ tokenAddress, precision: appInfo.tokenPrecision[tokenName]?.scale, amount: Number(bondAmount), bond_price_usd });
                const currentTxnStatus = await GetTransactionStatus(txn);

                if (currentTxnStatus?.status === "Executed") {
                    enqueueSnackbar("Transaction Successed!", { variant: "success" });
                    setBondAmount("");
                } else if (typeof currentTxnStatus?.status === "object") {
                    enqueueSnackbar(`${txn} Transaction Faild!`, { variant: "error" });
                }
                setBondLoading(false);
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
        } catch (e: any) {
            setBondLoading(false);
            enqueueSnackbar(e.toString(), { variant: "error" });
        }
    };

    const setMaxAmount = useCallback(() => {
        setBondAmount(101);
    }, []);

    return {
        bondLoading,
        bondAmount,
        buyBond,
        claimRedeemBond,
        setBondAmount,
        setMaxAmount,
    };
};
