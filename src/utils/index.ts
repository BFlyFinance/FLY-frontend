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
