import "./index.scss";

import { PropsWithChildren, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";

export interface iBondDialogData {
    title: string;
}

export interface iBondDialogProps {
    open: boolean;
    dialogData?: iBondDialogData;
    onClose: () => void;
}

export const useDialog = () => {
    const [dialogOpenState, setDialogOpenState] = useState(false);

    return {
        dialogOpenState,
        openDialog: () => {
            setDialogOpenState(true);
        },
        onDialogClose() {
            setDialogOpenState(false);
        },
    };
};

const FlyDialog = (
    props: PropsWithChildren<iBondDialogProps> = {
        open: false,
        dialogData: {} as iBondDialogData,
        onClose: () => {},
    },
) => {
    return (
        <Dialog open={props.open} onBackdropClick={props.onClose}>
            <DialogTitle>
                <CloseIcon className="dialog-close-btn" onClick={props.onClose}></CloseIcon>
                {props?.dialogData?.title}
            </DialogTitle>
            <DialogContent>{props.children}</DialogContent>
        </Dialog>
    );
};

export default FlyDialog;
