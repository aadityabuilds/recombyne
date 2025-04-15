import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./shimGlobal";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Loading } from "@teselagen/ui";
import store from "./store";
import "./fonts.css";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
ReactDOM.render(_jsx(React.StrictMode, { children: _jsxs(Provider, { store: store, children: [_jsx(Loading, {}), _jsx(App, {})] }) }), document.getElementById("root"));
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
