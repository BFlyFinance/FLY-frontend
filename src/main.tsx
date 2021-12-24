import "./assets/styles/index.scss";

import { SnackbarProvider } from "notistack";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";

import store from "./store";
import App from "./views/App";

ReactDOM.render(
    <SnackbarProvider maxSnack={1} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Provider store={store}>
            <HashRouter>
                <React.StrictMode>
                    <App />
                </React.StrictMode>
            </HashRouter>
        </Provider>
    </SnackbarProvider>,
    document.getElementById("root"),
);
