import "./header.scss";

import { AppBar, Toolbar } from "@mui/material";

import MenuIcon from "../../assets/icons/hamburger.svg";
// import TimeMenu from "./time-menu";
import ConnectButton from "../ConnectButton";

interface IHeader {
    handleDrawerToggle: () => void;
    drawe: boolean;
}

function Header({ handleDrawerToggle, drawe }: IHeader) {
    return (
        <div className={`topBar ${!drawe && "topBarShift"}`}>
            <AppBar position="sticky" className="appBar" elevation={0}>
                <Toolbar disableGutters className="dapp-topbar">
                    <div onClick={handleDrawerToggle} className="dapp-topbar-slider-btn">
                        <img src={MenuIcon} alt="menu" />
                    </div>
                    <div className="dapp-topbar-btns-wrap">
                        {/* {!isVerySmallScreen && <TimeMenu />} */}
                        <ConnectButton />
                    </div>
                </Toolbar>
            </AppBar>
        </div>
    );
}

export default Header;
