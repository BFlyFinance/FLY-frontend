import "./index.scss";

export interface IStateLabelProps {
    title: string;
    value: string | number;
}

const Statelabel = (props: IStateLabelProps) => {
    return (
        <div className="state-label">
            <div className="state-label__title">{props.title}</div>
            <div className="state-label__value">{props.value}</div>
        </div>
    );
};

export default Statelabel;
