import "./index.scss";

import classNames from "classnames";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import { Article } from "@mui/icons-material";
import { Drawer, Link } from "@mui/material";

import BondIcon from "../../assets/icons/bond.svg";
import StakeIcon from "../../assets/icons/stake.svg";
import Social from "./social";

interface INavDrawer {
    mobileOpen: boolean;
    isSmallerScreen: boolean;
    handleDrawerToggle: () => void;
}

export default ({ mobileOpen, isSmallerScreen, handleDrawerToggle }: INavDrawer) => {
    const [isActive] = useState();

    return (
        <Drawer
            variant={isSmallerScreen ? "temporary" : "permanent"}
            anchor="left"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            onClick={handleDrawerToggle}
            classes={{
                paper: "drawer-paper",
            }}
            ModalProps={{
                keepMounted: true,
            }}
        >
            <div className="drawer">
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
                    <Link href="https://wonderland.gitbook.io/wonderland/" target="_blank" className="doc-link">
                        <Article htmlColor="#fff"></Article>
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
