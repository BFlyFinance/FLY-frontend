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
import { getBondList, getBondPrice, iBondData } from "../../utils/service";

enum eBondTab {
    bond = "bond",
    redeem = "redeem",
}

export default () => {
    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(eBondTab.bond);

    const { dialogOpenState, openDialog, onDialogClose } = useDialog();
    const [dialogData, setDialogData] = useState({} as iBondDialogData);

    const [bondList, setBondList] = useState([] as iBondData[]);
    const account = useSelector<iReduxState, iAccountSlice>(state => state.account);

    const isSmallScreen = useMediaQuery(MEDIA_QUERY);

    const openDialogHandler = useCallback((data: iBondData) => {
        setDialogData({
            title: data.name,
        });
        openDialog();
    }, []);

    const onTabChanged = useCallback((event: React.SyntheticEvent, newValue: eBondTab) => {
        setTabValue(newValue as eBondTab);
    }, []);

    useEffect(() => {
        const init = async () => {
            await getBondPrice();
            setBondList((await getBondList()) as iBondData[]);
        };

        init();
    }, []);

    return (
        <div className="panel bond">
            <h1>Bond (1, 1) </h1>
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
            {isSmallScreen ? (
                // TODO: use card
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
                                        <LoadingButton variant="contained" onClick={() => openDialogHandler(row)}>
                                            Bond
                                        </LoadingButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Dialog  */}
            <FlyDialog open={dialogOpenState} onClose={onDialogClose} dialogData={dialogData}>
                <div className="dialog-body">
                    <Tabs value={tabValue} onChange={onTabChanged}>
                        <Tab label={eBondTab.bond} value={eBondTab.bond} />
                        <Tab label={eBondTab.redeem} value={eBondTab.redeem} />
                    </Tabs>
                    <div className="dialog-form">
                        <OutlinedInput
                            placeholder="Amount"
                            endAdornment={
                                <InputAdornment position="end">
                                    <span className="max-btn">MAX</span>
                                </InputAdornment>
                            }
                        />
                        <LoadingButton className="button" variant="contained" color="primary">
                            Bond
                        </LoadingButton>
                    </div>
                    <div className="dialog-data">
                        <DataRow title="Your Balance" value="100"></DataRow>
                        <DataRow title="You will Get" value="100"></DataRow>
                        <DataRow title="ROI" value="100"></DataRow>
                        <DataRow title="Debt Ratio" value="100"></DataRow>
                        <DataRow title="Vesting Term" value="100"></DataRow>
                    </div>
                </div>
            </FlyDialog>
        </div>
    );
};
