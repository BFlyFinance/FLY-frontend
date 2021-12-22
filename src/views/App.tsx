import "../assets/styles/App.scss";
import "../assets/styles/ui.scss";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";

import { makeStyles, useMediaQuery } from "@material-ui/core";

import Drawer from "../components/Drawer";
import Header from "../components/Header";
import Loader from "../components/Loader/index";
import { DRAWER_WIDTH, TRANSITION_DURATION } from "../constants/style";
import { getOracle, iAppSlice } from "../store/slices/app-slice";
import { iReduxState } from "../store/slices/state.interface";
import Bond from "./Bond";
import Stake from "./Stake";

const useStyles = makeStyles(theme => ({
    content: {
        padding: theme.spacing(1),
        transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: TRANSITION_DURATION,
        }),
        marginLeft: DRAWER_WIDTH,
        display: "flex",
        justifyContent: "center",
    },
    contentShift: {
        transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.easeOut,
            duration: TRANSITION_DURATION,
        }),
        marginLeft: 0,
    },
}));

interface ITokenPriceArray {
    [key: string]: string;
}

function App() {
    const classes = useStyles();
    const dispatch = useDispatch();

    const appInfo = useSelector<iReduxState, iAppSlice>(state => state.app);

    const [mobileOpen, setMobileOpen] = useState(false);

    const isSmallerScreen = useMediaQuery("(max-width: 960px)");

    const handleDrawerToggle = () => {
        if (isSmallerScreen) {
            setMobileOpen(!mobileOpen);
        }
    };

    useEffect(() => {
        setMobileOpen(!isSmallerScreen);
    }, [isSmallerScreen]);

    useEffect(() => {
        window.starcoin?.on("accountsChanged", () => {
            window.location.reload();
        });

        window.starcoin?.on("chainChanged", () => {
            window.location.reload();
        });

        dispatch(getOracle());

        return () => {
            window.starcoin.removeAllListeners();
        };
    }, []);

    return (
        <div>
            {appInfo.loading ? (
                <Loader></Loader>
            ) : (
                <div className="App">
                    <Drawer mobileOpen={mobileOpen} isSmallerScreen={isSmallerScreen} handleDrawerToggle={handleDrawerToggle}></Drawer>
                    <div className="main">
                        <Header handleDrawerToggle={handleDrawerToggle} drawe={!isSmallerScreen}></Header>
                        <div className={`${classes.content} ${isSmallerScreen && classes.contentShift}`}>
                            <Routes>
                                <Route path="/" element={<Navigate to="/stake" />}></Route>
                                <Route path="/stake" element={<Stake />}></Route>
                                <Route path="/bond" element={<Bond />}></Route>
                                <Route path="*" element={<Navigate to="/" />}></Route>
                            </Routes>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
