import axios from "axios";
import BigNumber from "bignumber.js";

export const shortCutOfAccountHash = (hash: string) => {
    return hash.replace(/^0x\w{4}(.*)\w{4}$/, (match, p1, offset, string) => {
        return string.replace(p1, "...");
    });
};

export const enum CHAIN_NAME {
    main = 1,
    barnard = 251,
    proxima = 252,
}

export const CONTRACT_ADDRESS = "0xc137657e5aed5099592ba07c8ab44cc5".toLowerCase();
export const TOEKN_FLY = `${CONTRACT_ADDRESS}::FLY::FLY`;
export const TOKEN_STC = `0x1::STC::STC`;

export const chainRpc = () => `https://${CHAIN_NAME["252"]}-seed.starcoin.org/`;

export const requestChain = async (method: string, params: any) =>
    await axios.post(chainRpc(), {
        id: 1,
        jsonrpc: "2.0",
        method,
        params,
    });

export const KEY_Balance = (token: string) => `0x00000000000000000000000000000001::Account::Balance<${token}>`;
export const ToChainAmount = (amount: number, precision: number = 9) => new BigNumber(amount).multipliedBy(precision);
export const ToHumanAmount = (amount: number, precision: number = 9) => new BigNumber(amount).dividedBy(precision);
