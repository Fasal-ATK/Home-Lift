import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { Button, CircularProgress, Box } from "@mui/material";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { startLoading, stopLoading } from "../../redux/slices/loadingSlice";

const CheckoutForm = ({ buttonLabel = "Pay Now" }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        dispatch(startLoading());
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/bookings?payment=success`,
            },
        });

        if (error) {
            setErrorMessage(error.message);
            setLoading(false);
        }
        dispatch(stopLoading());
    };

    return (
        <Box>
            <PaymentElement />
            <Box sx={{ mt: 3 }}>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    fullWidth
                    disabled={!stripe || loading}
                    sx={{ py: 1.5, fontWeight: "bold" }}
                >
                    {loading ? <CircularProgress size={24} /> : buttonLabel}
                </Button>
            </Box>
            {errorMessage && (
                <Box sx={{ color: "error.main", mt: 2, textAlign: "center" }}>
                    {errorMessage}
                </Box>
            )}
        </Box>
    );
};

export default CheckoutForm;
