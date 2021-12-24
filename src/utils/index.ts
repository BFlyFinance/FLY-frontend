import axios from "axios";
import BigNumber from "bignumber.js";

export const shortCutOfAccountHash = (hash: string) => {
    return hash.replace(/^0x\w{4}(.*)\w{4}$/, (match, p1, offset, string) => {
        return string.replace(p1, "...");
    });
};

export const prettifySeconds = (seconds?: number, resolution?: string) => {
    if (seconds !== 0 && !seconds) {
        return "";
    }

    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (resolution === "day") {
        return d + (d == 1 ? " day" : " days");
    }

    const dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    const hDisplay = h > 0 ? h + (h == 1 ? " Hour, " : " Hours, ") : "";
    const mDisplay = m > 0 ? m + (m == 1 ? " Min" : " Mins") : "";

    return dDisplay + hDisplay + mDisplay;
};

interface ROIParams {
    [key: string]: number;
}

export const ROI = ({ bondPrice, tokenPrice }: ROIParams) => {
    return new BigNumber(1).minus(new BigNumber(bondPrice).dividedBy(tokenPrice)).multipliedBy(100).valueOf() + "%";
};

export enum CHAIN_NAME {
    main = 1,
    barnard = 251,
    proxima = 252,
}

export const CONTRACT_ADDRESS = "0xc137657e5aed5099592ba07c8ab44cc5".toLowerCase();
export const SWAP_CONTRACT_ADDRESS = "0x4783d08fb16990bd35d83f3e23bf93b8".toLocaleLowerCase();
export const TOEKN_FLY = `${CONTRACT_ADDRESS}::FLY::FLY`;
export const TOKEN_STC = `0x1::STC::STC`;
export const TOKEN_FLY_FAI = `${SWAP_CONTRACT_ADDRESS}::TokenSwap::LiquidityToken<${CONTRACT_ADDRESS}::TokenMock::FAI, ${CONTRACT_ADDRESS}::FLY::FLY>`;
export const TOKEN_FLY_STC = `${SWAP_CONTRACT_ADDRESS}::TokenSwap::LiquidityToken<${TOKEN_STC}, ${CONTRACT_ADDRESS}::FLY::FLY>`;

export const chainRpc = () => `https://${CHAIN_NAME[252]}-seed.starcoin.org/`;

export const requestChain = async (method: string, params: any) =>
    await axios.post(chainRpc(), {
        id: 1,
        jsonrpc: "2.0",
        method,
        params,
    });

export const KEY_Balance = (token: string) => `0x00000000000000000000000000000001::Account::Balance<${token}>`;
export const ToChainAmount = (amount: number, precision: number = Math.pow(10, 9)) => new BigNumber(amount).multipliedBy(precision);
export const ToHumanAmount = (amount: number, precision: number = Math.pow(10, 9)) => new BigNumber(amount).dividedBy(precision);
