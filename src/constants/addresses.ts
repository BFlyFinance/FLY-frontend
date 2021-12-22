import { Networks } from "./blockchain";

interface IAddresses {
    [key: string]: string;
}

let STC_MAINNET: IAddresses = {};
Object.keys(process.env).forEach(key => {
    const addressMatch = key.match(/^REACT_APP_(.*_ADDRESS)$/);
    if (!addressMatch || addressMatch!.length < 1) return;

    const addressName = addressMatch[1];
    if (addressName) {
        STC_MAINNET[addressName] = String(process.env[key]);
    }
});

export const getAddresses = (networkID: number) => {
    if (networkID === Networks.STC) return STC_MAINNET;

    throw Error("Network don't support");
};
