import "./index.scss";

import { Grid, InputAdornment, OutlinedInput, Skeleton, Tab, Tabs, useMediaQuery } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { CustomButton } from "../../constants/assets/button";
import DataRow from "../../components/DataRow/index";
import { LoadingButton } from "@mui/lab";
import { MEDIA_QUERY } from "../../constants/index";
import Statelabel from "../../components/StateLabel/index";
import useStake from "./useStake";
import numeral from "numeral";

enum eStakeTab {
    stake = "stake",
    unstake = "unstake",
}

export default () => {
    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(eStakeTab.stake);

    const isSmallScreen = useMediaQuery(MEDIA_QUERY);
    const {
        stakeLoading,
        stakeAmount,
        balance,
        stakedBalance,
        stakedROI5days,
        apy,
        tvl,
        stakeToken,
        unStakeToken,
        setStakeAmount,
        setMaxAmount,
        setUnStakeMaxAmount,
        setStakedROI5days,
    } = useStake();

    const onTabChanged = useCallback((event: React.SyntheticEvent, newValue: eStakeTab) => {
        setTabValue(newValue as eStakeTab);
    }, []);

    const inputChangeHandler = useCallback(value => {
        setStakeAmount(value.replace(/^0(\d)/, "$1"));
    }, []);

    useEffect(() => {
        setStakeAmount(0);
    }, [tabValue]);

    return (
        <div className="panel stake">
            <h1>Stake (3, 3) </h1>
            <Grid container spacing={2} className="stat-container">
                <Grid item xs={12} sm={6} className="stat">
                    <Statelabel title={"APY"} value={`${apy}%`}></Statelabel>
                </Grid>
                <Grid item xs={12} sm={6} className="stat">
                    <Statelabel title={"Total Value Deposited"} value={`$${numeral(tvl).format("0,0")}`}></Statelabel>
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
                                <span className="max-btn" onClick={() => (tabValue === eStakeTab.stake ? setMaxAmount() : setUnStakeMaxAmount())}>
                                    MAX
                                </span>
                            </InputAdornment>
                        }
                        onChange={el => inputChangeHandler(el.target.value)}
                        autoFocus
                    />
                    <LoadingButton
                        sx={CustomButton}
                        loading={stakeLoading}
                        variant="contained"
                        color="primary"
                        onClick={() => (tabValue === eStakeTab.stake ? stakeToken("fly") : unStakeToken("fly"))}
                    >
                        {tabValue}
                    </LoadingButton>
                </div>
                <div className="dialog-data">
                    <DataRow title="Your Balance" value={`$${balance}`}></DataRow>
                    <DataRow title="Staked Balance" value={`$${stakedBalance}`}></DataRow>
                    <DataRow title="ROI (5-Day Rate)" value={`${stakedROI5days}%`}></DataRow>
                </div>
            </div>
        </div>
    );
};
