import "../assets/styles/App.scss";
import "../assets/styles/ui.scss";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";

import { useMediaQuery } from "@mui/material";

import Drawer from "../components/Drawer";
import Header from "../components/Header";
import Loader from "../components/Loader/index";
import { getTokenPrecision, getOracle, iAppSlice, setMarketIndex } from "../store/slices/app-slice";
import { iReduxState } from "../store/slices/state.interface";
import { getMarketIndex } from "../utils/service";
import Bond from "./Bond";
import Stake from "./Stake";

function App() {
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

        // Get Token Price
        dispatch(getOracle());
        dispatch(getTokenPrecision());

        const init = async () => {
            const result = await getMarketIndex();
            // dispatch MarketIndex
            if (Array.isArray(result) && result.length > 0) {
                dispatch(setMarketIndex(result[0]));
            }
        };

        init();

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
                        <div className={`content ${isSmallerScreen && "content-shift"}`}>
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
