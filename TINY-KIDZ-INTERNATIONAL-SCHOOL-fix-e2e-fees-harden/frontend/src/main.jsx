import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.jsx";
import store from "./redux/store.js";
import "./style.css";

const lastEmail = sessionStorage.getItem("lastEmail");
localStorage.removeItem("token");
localStorage.removeItem("user");
localStorage.removeItem("role");
// Preserve lastEmail so login page can pre-fill it after refresh
if (lastEmail) sessionStorage.setItem("lastEmail", lastEmail);

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <App />
  </Provider>,
);
