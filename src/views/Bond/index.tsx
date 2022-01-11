import "./index.scss";

import { CustomButton, CustomButtonSmall } from "../../constants/assets/button";
import FlyDialog, { iBondDialogData, useDialog } from "../../components/FlyDialog/index";
import { Grid, InputAdornment, OutlinedInput, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, useMediaQuery, Card, CardContent } from "@mui/material";
import { ROI, prettifySeconds, ToHumanAmount } from "../../utils/index";
import { getBondList, iBondData, getAssetPool, iAssetPoolData } from "../../utils/service";
import { useCallback, useEffect, useState } from "react";

import DataRow from "../../components/DataRow/index";
import Loader from "../../components/Loader";
import { LoadingButton } from "@mui/lab";
import { MEDIA_QUERY } from "../../constants/index";
import Statelabel from "../../components/StateLabel";
import { iAccountSlice } from "../../store/slices/account-slice";
import { iReduxState } from "../../store/slices/state.interface";
import useBond from "./useBond";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { iAppSlice } from "../../store/slices/app-slice";

enum eBondTab {
    bond = "bond",
    redeem = "redeem",
}

export default () => {
    const { enqueueSnackbar } = useSnackbar();

    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(eBondTab.bond);
    const [treasury, setTreasury] = useState<number | string>("0");

    const { dialogOpenState, openDialog, onDialogClose } = useDialog();
    const { bondAmount, bondLoading, currentTokenBalance, bondDebtRatio, dialogData, setDialogData, buyBond, claimRedeemBond, setBondAmount, setMaxAmount } = useBond();

    const [bondList, setBondList] = useState([] as iBondData[]);
    const account = useSelector<iReduxState, iAccountSlice>(state => state.account);
    const appInfo = useSelector<iReduxState, iAppSlice>(state => state.app);

    const isSmallScreen = useMediaQuery(MEDIA_QUERY);

    const openDialogHandler = useCallback((data: iBondData) => {
        setDialogData({
            ...data,
            title: data.name,
        });
        openDialog();
    }, []);

    const onTabChanged = useCallback((event: React.SyntheticEvent, newValue: eBondTab) => {
        setTabValue(newValue as eBondTab);
    }, []);

    useEffect(() => {
        if (!dialogOpenState) {
            setDialogData({} as iBondDialogData);
            setBondAmount("");
        }
    }, [dialogOpenState]);

    // useEffect(() => {
    //     console.log(account);
    // }, [account]);

    useEffect(() => {
        if (bondList.length > 0) {
            // Set Treasury
            (async () => {
                const assetPool: iAssetPoolData = (await getAssetPool(bondList)) as iAssetPoolData;
                const treasury = Object.keys(assetPool).reduce((prev, current, index) => {
                    return ToHumanAmount(assetPool[current], appInfo.tokenPrecision[current.toLocaleLowerCase()]?.scale)
                        .multipliedBy(appInfo.tokenPrice[current] || 1)
                        .plus(prev)
                        .toNumber();
                }, 0);
                setTreasury(treasury);
            })();
        }
    }, [bondList]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                setBondList((await getBondList()) as iBondData[]);
                setLoading(false);
            } catch (e: any) {
                enqueueSnackbar(e.toString(), { variant: "error" });
            }
        };

        init();
    }, []);

    return (
        <div className="panel bond">
            <h1>Bond (1, 1) </h1>

            <div style={{ width: "100%" }}>
                {/* Grid */}
                <Grid container spacing={0} className="stat-container">
                    <Grid item xs={12} sm={6} className="stat">
                        <Statelabel title={"Treasury Balance"} value={treasury}></Statelabel>
                    </Grid>
                    <Grid item xs={12} sm={6} className="stat">
                        <Statelabel title={"FLY Price"} value={`$${appInfo.tokenPrice["fly"] || "1"}`}></Statelabel>
                    </Grid>
                </Grid>
                {/* Table */}
                {loading ? (
                    <Loader />
                ) : (
                    <div>
                        {isSmallScreen ? ( // TODO: use card
                            <div className="bond-card-list">
                                {bondList.map((row, index) => (
                                    <Card className="bond-card" key={index}>
                                        <CardContent>
                                            <Statelabel title={"Bond"} value={row.name}></Statelabel>
                                            <Statelabel
                                                title={"Price"}
                                                value={ToHumanAmount(row.bond_price_usd as number, Math.pow(10, 18))
                                                    .dp(4)
                                                    .toNumber()}
                                            ></Statelabel>
                                            <Statelabel
                                                title={"ROI"}
                                                value={`${row
                                                    .roi(1 * Math.pow(10, 18))
                                                    .dp(4)
                                                    .toNumber()}%`}
                                            ></Statelabel>
                                            <Statelabel title={"Purchased"} value={`${row.purchased(1).dp(4).toNumber()} %`}></Statelabel>
                                            <LoadingButton sx={CustomButtonSmall} variant="contained" onClick={() => openDialogHandler(row)}>
                                                Bond
                                            </LoadingButton>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <TableContainer className="panel-table">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Bond</TableCell>
                                            <TableCell>Price</TableCell>
                                            <TableCell>ROI</TableCell>
                                            <TableCell>Purchased</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {bondList.map((row, index) => (
                                            <TableRow key={index} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell>
                                                    {ToHumanAmount(row.bond_price_usd as number, Math.pow(10, 18))
                                                        .dp(4)
                                                        .toNumber()}
                                                </TableCell>
                                                <TableCell>
                                                    {row
                                                        .roi(1 * Math.pow(10, 18))
                                                        .dp(4)
                                                        .toNumber()}
                                                    %
                                                </TableCell>
                                                <TableCell>
                                                    ${ToHumanAmount(row.purchased(1).toNumber(), appInfo?.tokenPrecision[row.name.toLowerCase()]?.scale).toNumber()}
                                                </TableCell>
                                                <TableCell>
                                                    <LoadingButton sx={CustomButtonSmall} variant="contained" onClick={() => openDialogHandler(row)}>
                                                        Bond
                                                    </LoadingButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </div>
                )}
            </div>

            {/* Dialog  */}
            <FlyDialog open={dialogOpenState} hideClose={bondLoading} onClose={onDialogClose} dialogData={dialogData}>
                <div className="dialog-body">
                    <Tabs value={tabValue} onChange={onTabChanged}>
                        <Tab label={eBondTab.bond} value={eBondTab.bond} />
                        <Tab label={eBondTab.redeem} value={eBondTab.redeem} />
                    </Tabs>
                    {tabValue === eBondTab.bond && (
                        <div className="dialog-form">
                            <OutlinedInput
                                placeholder="Amount"
                                disabled={bondLoading}
                                type="number"
                                value={bondAmount}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <span className="max-btn" onClick={setMaxAmount}>
                                            MAX
                                        </span>
                                    </InputAdornment>
                                }
                                onChange={el => setBondAmount(Number(el.target.value))}
                                autoFocus
                            />
                            {/* TODO: redeem needs claim button */}
                            <LoadingButton sx={CustomButton} loading={bondLoading} variant="contained" color="primary" onClick={() => buyBond(dialogData)}>
                                {tabValue}
                            </LoadingButton>
                        </div>
                    )}
                    {tabValue === eBondTab.redeem && (
                        <div className="dialog-form">
                            <DataRow title={"Vesting Percent"} value={`${account?.bondDetail[dialogData?.name?.toLowerCase()]?.vesting_percent || 0 * 100}%`}></DataRow>
                            {/* TODO: redeem needs claim button */}
                            <LoadingButton
                                disabled={account?.bondDetail[dialogData?.name?.toLowerCase()]?.vesting_percent == 0}
                                sx={CustomButton}
                                loading={bondLoading}
                                variant="contained"
                                color="primary"
                                onClick={() => claimRedeemBond(dialogData)}
                            >
                                CLAIM
                            </LoadingButton>
                        </div>
                    )}

                    <div className="dialog-data">
                        <DataRow title="Your Balance" value={currentTokenBalance}></DataRow>
                        {/* Basc on inputNumber * current token price / bond price */}
                        <DataRow title="You will Get" value="0"></DataRow>
                        {/* ROI = (1 - bond_price / oracle_price<FLY>) * 100  (%) */}
                        <DataRow title="ROI" value={ROI({ tokenPrice: 1, bondPrice: 1 })}></DataRow>
                        <DataRow title="Debt Ratio" value={bondDebtRatio}></DataRow>
                        <DataRow title="Vesting Term" value={prettifySeconds(dialogData.vesting_term)}></DataRow>
                    </div>
                </div>
            </FlyDialog>
        </div>
    );
};
