import "./index.scss";

import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { LoadingButton } from "@mui/lab";
import { Grid, InputAdornment, OutlinedInput, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, useMediaQuery } from "@mui/material";

import DataRow from "../../components/DataRow/index";
import FlyDialog, { iBondDialogData, useDialog } from "../../components/FlyDialog/index";
import Statelabel from "../../components/StateLabel";
import { MEDIA_QUERY } from "../../constants/index";
import { iAccountSlice } from "../../store/slices/account-slice";
import { iReduxState } from "../../store/slices/state.interface";
import { getBondList, iBondData } from "../../utils/service";
import { CustomButton, CustomButtonSmall } from "../../constants/assets/button";
import useBond from "./useBond";
import { useSnackbar } from "notistack";
import { prettifySeconds, ROI } from "../../utils/index";
import Loader from "../../components/Loader";

enum eBondTab {
    bond = "bond",
    redeem = "redeem",
}

export default () => {
    const { enqueueSnackbar } = useSnackbar();

    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(eBondTab.bond);

    const { dialogOpenState, openDialog, onDialogClose } = useDialog();
    const { buyBond, bondAmount, bondLoading, setBondAmount, setMaxAmount } = useBond();
    const [dialogData, setDialogData] = useState({} as iBondDialogData);

    const [bondList, setBondList] = useState([] as iBondData[]);
    const account = useSelector<iReduxState, iAccountSlice>(state => state.account);

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
                <Grid container spacing={2} className="stat-container">
                    <Grid item xs={12} sm={6} className="stat">
                        <Statelabel title={"Treasury Balance"} value={100}></Statelabel>
                    </Grid>
                    <Grid item xs={12} sm={6} className="stat">
                        <Statelabel title={"FLY Price"} value={"$100"}></Statelabel>
                    </Grid>
                </Grid>
                {/* Table */}
                {loading ? (
                    <Loader />
                ) : (
                    <div>
                        {isSmallScreen ? ( // TODO: use card
                            <div>"ok"</div>
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
                                                <TableCell>Price</TableCell>
                                                <TableCell>ROI</TableCell>
                                                <TableCell>Purchased</TableCell>
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
                        <LoadingButton sx={CustomButton} loading={bondLoading} variant="contained" color="primary" onClick={() => buyBond(dialogData)}>
                            {tabValue}
                        </LoadingButton>
                    </div>
                    <div className="dialog-data">
                        <DataRow title="Your Balance" value="100"></DataRow>
                        <DataRow title="You will Get" value="100"></DataRow>
                        <DataRow title="ROI" value={ROI({ tokenPrice: 2, bondPrice: 1 })}></DataRow>
                        <DataRow title="Debt Ratio" value="100"></DataRow>
                        <DataRow title="Vesting Term" value={prettifySeconds(dialogData.vesting_term)}></DataRow>
                    </div>
                </div>
            </FlyDialog>
        </div>
    );
};
