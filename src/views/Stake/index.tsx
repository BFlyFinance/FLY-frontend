import "./index.scss";

import { useCallback, useState } from "react";
import { useSelector } from "react-redux";

import { LoadingButton } from "@mui/lab";
import { Button, Grid, TextField } from "@mui/material";

import ConnectButton from "../../components/ConnectButton/index";
import { iAccountSlice } from "../../store/slices/account-slice";
import { iReduxState } from "../../store/slices/state.interface";
import { stakeService } from "../../utils/service";

export default () => {
    const [loading, setLoading] = useState(false);
    const account = useSelector<iReduxState, iAccountSlice>(state => state.account);

    const stake = useCallback(async () => {
        setLoading(true);
        try {
            await stakeService(100);
        } catch (e) {}
        setLoading(false);
    }, []);

    return (
        <div className="panel stake">
            <h1>Stake (3, 3) </h1>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <TextField className="text-field" label="Stack Here" variant="standard" inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }} />
                    {account.address ? (
                        <LoadingButton variant="outlined" onClick={stake} loading={loading}>
                            Stake
                        </LoadingButton>
                    ) : (
                        <ConnectButton />
                    )}
                </Grid>
                <Grid item xs={12} sm={4}>
                    1<Button variant="outlined">Forfeit</Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                    3<Button variant="outlined">Unstake</Button>
                </Grid>
            </Grid>
        </div>
    );
};
