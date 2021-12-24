import "./index.scss";

import { PropsWithChildren, useCallback, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";

import { iBondData } from "../../utils/service";

export interface iBondDialogData extends iBondData {
    title: string;
}

export interface iBondDialogProps {
    open: boolean;
    hideClose?: boolean;
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
    const onClose = useCallback(() => {
        if (!props.hideClose) {
            props.onClose();
        }
    }, [props.onClose, props.hideClose]);

    return (
        <Dialog open={props.open} onBackdropClick={onClose}>
            <DialogTitle>
                {props.hideClose ? null : <CloseIcon className="dialog-close-btn" onClick={onClose}></CloseIcon>}
                {props?.dialogData?.title}
            </DialogTitle>
            <DialogContent>{props.children}</DialogContent>
        </Dialog>
    );
};

export default FlyDialog;
