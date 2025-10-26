import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./Redux/store";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import global CSS
import "./index.css"; // <-- make sure this exists and includes Tailwind or other styles

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      {/* ✅ Toast container should exist once here */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Provider>
  </React.StrictMode>
);
