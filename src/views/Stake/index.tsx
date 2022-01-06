import "./index.scss";

import { Grid, InputAdornment, OutlinedInput, Tab, Tabs, useMediaQuery } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { CustomButton } from "../../constants/assets/button";
import DataRow from "../../components/DataRow/index";
import { LoadingButton } from "@mui/lab";
import { MEDIA_QUERY } from "../../constants/index";
import Statelabel from "../../components/StateLabel/index";
import useStake from "./useStake";
import numeral from "numeral";
import BigNumber from "bignumber.js";
import { useSelector } from "react-redux";
import { iReduxState } from "../../store/slices/state.interface";
import { iAccountSlice } from "../../store/slices/account-slice";
import { ToHumanAmount } from "../../utils";

enum eStakeTab {
    stake = "stake",
    unstake = "unstake",
}

export default () => {
    const [tabValue, setTabValue] = useState(eStakeTab.stake);
    const [overBalanceLimit, setOverBalanceLimit] = useState(false);
    const account = useSelector<iReduxState, iAccountSlice>(state => state.account);
    const appInfo = useSelector<iReduxState, any>(state => state.app);

    const isSmallScreen = useMediaQuery(MEDIA_QUERY);
    const {
        stakeLoading,
        forfeiLoading,
        stakeInputAmount,
        balance,
        stakedBalance,
        wramupBalance,
        wramupDuration,
        stakedROI5days,
        apy,
        tvl,
        stakeToken,
        unStakeToken,
        setStakeInputAmount,
        setMaxAmount,
        setUnStakeMaxAmount,
        forfeitToken,
    } = useStake();

    const onTabChanged = useCallback((event: React.SyntheticEvent, newValue: eStakeTab) => {
        setTabValue(newValue as eStakeTab);
    }, []);

    const inputChangeHandler = useCallback(
        value => {
            const inputNumber = value.replace(/^0(\d)/, "$1");

            if (tabValue === eStakeTab.stake) {
                setOverBalanceLimit(new BigNumber(inputNumber).isGreaterThan(balance));
            } else if (tabValue === eStakeTab.unstake) {
                setOverBalanceLimit(new BigNumber(inputNumber).isGreaterThan(ToHumanAmount(account?.stakedDetail?.amount, appInfo.tokenPrecision["fly"]?.scale)));
            }

            setStakeInputAmount(value.replace(/^0(\d)/, "$1"));
        },
        [tabValue, balance, appInfo.tokenPrecision["fly"]?.scale],
    );

    useEffect(() => {
        setStakeInputAmount(0);
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
                        value={stakeInputAmount}
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
                    {overBalanceLimit && <p className="error-tips">Over Balance Limit</p>}
                    <LoadingButton
                        sx={CustomButton}
                        loading={stakeLoading}
                        variant="contained"
                        color="primary"
                        disabled={overBalanceLimit}
                        onClick={() => (tabValue === eStakeTab.stake ? stakeToken("fly") : unStakeToken("fly"))}
                    >
                        {tabValue}
                    </LoadingButton>
                </div>
                <div className="dialog-data">
                    <DataRow title="Your Balance" value={`${balance} FLY`}></DataRow>
                    <DataRow title="Staked Balance" value={`${stakedBalance} FLY`}></DataRow>
                    <DataRow title="ROI (5-Day Rate)" value={`${stakedROI5days}%`}></DataRow>
                    <DataRow
                        title={`Wramup FLY Amount ${wramupDuration}`}
                        value={
                            <div className="forfeit-btn-box">
                                {wramupBalance} FLY
                                {wramupBalance != 0 ? (
                                    <LoadingButton className="forfeit-btn" sx={CustomButton} variant="contained" loading={forfeiLoading} onClick={() => forfeitToken()}>
                                        FORFEIT
                                    </LoadingButton>
                                ) : null}
                            </div>
                        }
                    ></DataRow>
                </div>
            </div>
        </div>
    );
};
