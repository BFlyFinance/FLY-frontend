import "./index.scss";

import { useCallback, useState } from "react";
import { useSelector } from "react-redux";

import { Grid, useMediaQuery, Tabs, Tab, OutlinedInput, InputAdornment } from "@mui/material";

import Statelabel from "../../components/StateLabel/index";
import { iAccountSlice } from "../../store/slices/account-slice";
import { iReduxState } from "../../store/slices/state.interface";
import { MEDIA_QUERY } from "../../constants/index";
import { CustomButton } from "../../constants/assets/button";
import useStake from "./useStake";
import DataRow from "../../components/DataRow/index";
import { LoadingButton } from "@mui/lab";

enum eStakeTab {
    stake = "stake",
    unstake = "unstake",
}

export default () => {
    const [loading, setLoading] = useState(false);
    const account = useSelector<iReduxState, iAccountSlice>(state => state.account);

    const isSmallScreen = useMediaQuery(MEDIA_QUERY);
    const { stakeLoading, stakeAmount, stakeToken, setStakeAmount, setMaxAmount } = useStake();
    const [tabValue, setTabValue] = useState(eStakeTab.stake);

    const onTabChanged = useCallback((event: React.SyntheticEvent, newValue: eStakeTab) => {
        setTabValue(newValue as eStakeTab);
    }, []);

    const stake = useCallback(async () => {
        setLoading(true);
        try {
        } catch (e) {}
        setLoading(false);
    }, []);

    return (
        <div className="panel stake">
            <h1>Stake (3, 3) </h1>
            <Grid container spacing={2} className="stat-container">
                <Grid item xs={12} sm={6} className="stat">
                    <Statelabel title={"APY"} value={"6231.1%"}></Statelabel>
                </Grid>
                <Grid item xs={12} sm={6} className="stat">
                    <Statelabel title={"Total Value Deposited"} value={"$1,856,249"}></Statelabel>
                </Grid>
            </Grid>
            <div className="dialog-body">
                <Tabs value={tabValue} onChange={onTabChanged}>
                    <Tab label={eStakeTab.stake} value={eStakeTab.stake} />
                    <Tab label={eStakeTab.unstake} value={eStakeTab.unstake} />
                </Tabs>
                <div className="dialog-form">
                    <OutlinedInput
                        placeholder="Amount"
                        disabled={stakeLoading}
                        type="number"
                        value={stakeAmount}
                        endAdornment={
                            <InputAdornment position="end">
                                <span className="max-btn" onClick={setMaxAmount}>
                                    MAX
                                </span>
                            </InputAdornment>
                        }
                        onChange={el => setStakeAmount(Number(el.target.value))}
                        autoFocus
                    />
                    <LoadingButton sx={CustomButton} loading={stakeLoading} variant="contained" color="primary" onClick={() => stakeToken("fly")}>
                        {tabValue}
                    </LoadingButton>
                </div>
                <div className="dialog-data">
                    <DataRow title="Your Balance" value="100"></DataRow>
                    <DataRow title="Staked Balance" value="100"></DataRow>
                    <DataRow title="ROI (5-Day Rate)" value="ROI"></DataRow>
                </div>
            </div>
        </div>
    );
};
