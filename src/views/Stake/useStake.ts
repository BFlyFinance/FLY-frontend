import { useState, useCallback } from "react";
import { stakeService, GetTransactionStatus } from "../../utils/service";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { iReduxState } from "../../store/slices/state.interface";
import { iAppSlice } from "../../store/slices/app-slice";

export default () => {
    const appInfo = useSelector<iReduxState, iAppSlice>(state => state.app);

    const [stakeLoading, setStakeLoading] = useState(false);
    const [stakeAmount, setStakeAmount] = useState<number | string>("");
    const { enqueueSnackbar } = useSnackbar();

    const setMaxAmount = useCallback(() => {
        setStakeAmount(102);
    }, []);

    const stakeToken = async (name: string) => {
        try {
            if (stakeAmount !== 0) {
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
            } else {
                enqueueSnackbar("Please enter amount", { variant: "error" });
            }
        } catch (e: any) {
            setStakeLoading(false);
            enqueueSnackbar(e.toString(), { variant: "error" });
        }
    };

    return {
        stakeLoading,
        stakeAmount,
        stakeToken,
        setStakeAmount,
        setMaxAmount,
    };
};
