// src/components/common/Toast.js
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Wrapper functions
export const ShowToast = (message, type = "info") => {
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "warning":
      toast.warning(message);
      break;
    default:
      toast.info(message);
  }
};

// Reusable container (put once in App.jsx)  
export const ToastWrapper = () => (
  <ToastContainer
    position="top-right"
    autoClose={3000}
    hideProgressBar={false}
    newestOnTop={true}
    closeOnClick
    pauseOnHover
    draggable
    theme="colored"
  />
);
