import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiConnector";
import rzpLogo from "../../assets/Logo/rzp_logo.png"
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";


const { PROCESS_PAYMENT_API, SEND_PAYMENT_SUCCESS_EMAIL_API } = studentEndpoints;
function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;

        script.onload = () => {
            resolve(true);
        }
        script.onerror = () => {
            resolve(false);
        }
        document.body.appendChild(script);
    })
}

// ================ buyCourse ================ 
export async function buyCourse(token, coursesId, userDetails, navigate, dispatch) {
    const toastId = toast.loading("Processing payment...");
    dispatch(setPaymentLoading(true));

    try {
        // Process the payment
        const response = await apiConnector("POST", PROCESS_PAYMENT_API,
            { coursesId },
            {
                Authorization: `Bearer ${token}`,
            })

        if (!response.data.success) {
            throw new Error(response.data.message);
        }

        // If payment is successful
        toast.success("Payment successful, you are added to the course");
        
        // Send confirmation email
        await sendPaymentSuccessEmail(response.data.paymentId, response.data.amount, token);

        navigate("/dashboard/enrolled-courses");
        dispatch(resetCart());
    }
    catch (error) {
        console.log("PAYMENT API ERROR.....", error);
        toast.error(error.response?.data?.message || "Could not process payment");
    }
    
    toast.dismiss(toastId);
    dispatch(setPaymentLoading(false));
}

// ================ send Payment Success Email ================
async function sendPaymentSuccessEmail(paymentId, amount, token) {
    try {
        await apiConnector("POST", SEND_PAYMENT_SUCCESS_EMAIL_API, {
            paymentId,
            amount,
        }, {
            Authorization: `Bearer ${token}`
        })
    }
    catch (error) {
        console.log("PAYMENT SUCCESS EMAIL ERROR....", error);
    }
}