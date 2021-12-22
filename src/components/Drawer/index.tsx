import { useState } from "react";
import { Drawer, Link, makeStyles } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import { DRAWER_WIDTH } from "../../constants/style";
import classNames from "classnames";

import StakeIcon from "../../assets/icons/stake.svg";
import BondIcon from "../../assets/icons/bond.svg";
import DocsIcon from "../../assets/icons/stake.svg";

import "./index.scss";
import Social from "./social";

const useStyle = makeStyles(theme => ({
    drawer: {
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        width: DRAWER_WIDTH,
        height: "100%",
        flexShrink: 0,
        padding: 20,
        fontFamily: "Montserrat SemiBold",
        boxSizing: "border-box",
        [theme.breakpoints.up("sm")]: {
            width: DRAWER_WIDTH,
            flexShrink: 0,
            display: "flex",
        },
    },
    drawerPaper: {
        borderRight: 0,
    },
}));

interface INavDrawer {
    mobileOpen: boolean;
    isSmallerScreen: boolean;
    handleDrawerToggle: () => void;
}

export default ({ mobileOpen, isSmallerScreen, handleDrawerToggle }: INavDrawer) => {
    const classes = useStyle();
    const [isActive] = useState();

    return (
        <Drawer
            variant={isSmallerScreen ? "temporary" : "permanent"}
            anchor="left"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            onClick={handleDrawerToggle}
            classes={{
                paper: classes.drawerPaper,
            }}
            ModalProps={{
                keepMounted: true,
            }}
        >
            <div className={classes.drawer}>
                <div className="logo">FLY Defi</div>
                <div className="dapp-nav">
                    <Link component={NavLink} to="/stake" className={classNames("button-dapp-menu", { active: isActive })}>
                        <div className="dapp-menu-item">
                            <img alt="stake" src={StakeIcon} />
                            <p>Stake</p>
                        </div>
                    </Link>
                    <Link component={NavLink} to="/bond" className={classNames("button-dapp-menu", { active: isActive })}>
                        <div className="dapp-menu-item">
                            <img alt="bond" src={BondIcon} />
                            <p>Bond</p>
                        </div>
                    </Link>
                </div>
                <div className="dapp-menu-doc-link">
                    <Link href="https://wonderland.gitbook.io/wonderland/" target="_blank">
                        <img alt="" src={DocsIcon} />
                        <p>Docs</p>
                    </Link>
                    {/* <Link href="https://legacy.wonderland.money/" target="_blank">
                        <p>Legacy website</p>
                    </Link> */}
                </div>
                <Social />
            </div>
        </Drawer>
    );
};
