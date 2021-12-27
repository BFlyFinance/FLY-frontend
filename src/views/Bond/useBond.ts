import { useCallback, useState, useEffect } from "react";
import { useSnackbar } from "notistack";
import { buyBondService, GetTransactionStatus } from "../../utils/service";
import { iBondDialogData } from "../../components/FlyDialog/index";
import { useSelector } from "react-redux";
import { iReduxState } from "../../store/slices/state.interface";
import { iAppSlice } from "../../store/slices/app-slice";

export default () => {
    const appInfo = useSelector<iReduxState, iAppSlice>(state => state.app);
    const [bondLoading, setBondLoading] = useState(false);
    const [bondAmount, setBondAmount] = useState<number | string>("");
    const { enqueueSnackbar } = useSnackbar();

    const buyBond = async ({ tokenAddress, max_price = 0, name }: iBondDialogData) => {
        try {
            if (bondAmount !== 0 && bondAmount !== "") {
                setBondLoading(true);
                const tokenName = name.toLocaleLowerCase();

                const txn = await buyBondService({ percision: appInfo.tokenPrecision[tokenName]?.scale, tokenAddress, amount: Number(bondAmount), max_price });
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

    const setMaxAmount = useCallback(() => {
        setBondAmount(101);
    }, []);

    return {
        bondLoading,
        bondAmount,
        buyBond,
        setBondAmount,
        setMaxAmount,
    };
};
