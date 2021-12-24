export const CustomButton = {
    background: "hsla(0, 0%, 100%, 0.2)",
    boxShadow: "0 0 10px rgb(44 39 109 / 10%)",
    borderRadius: "5px",
    padding: "9px 20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontFamily: "Montserrat SemiBold",
    fontSize: "18px",
    flexShrink: "0",
    height: "50px",
    color: "white",

    "& .MuiCircularProgress-svg": {
        color: "white",
    },
};

export const CustomButtonSmall = {
    ...CustomButton,
    fontSize: "14px",
    height: "30px",
};
