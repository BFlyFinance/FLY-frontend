import React from "react";
import "./index.scss";

export interface iDataRowProps {
    title: string;
    value: string | React.ReactElement | number;
}

const DataRow = (props: iDataRowProps) => {
    return (
        <div className="data-row">
            <div className="data-row__title">{props.title}</div>
            <div className="data-row__value">{props.value}</div>
        </div>
    );
};

export default DataRow;
