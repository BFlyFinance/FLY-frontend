import { CircularProgress } from "@mui/material";
import "./loader.scss";

function Loader() {
    return (
        <div className="loader-wrap">
            <CircularProgress size={120} color="inherit" />
        </div>
    );
}

export default Loader;
