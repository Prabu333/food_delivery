import React, { useEffect, useRef } from "react";
import { toast } from "react-toastify";

interface PaymentModalProps {
  amount: number;
  planTitle: string;
  onSuccess: (paymentId: string) => void;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  amount,
  planTitle,
  onSuccess,
  onClose,
}) => {
  const razorpayRef = useRef<any>(null);

  useEffect(() => {
    const loadScript = (src: string) =>
      new Promise<boolean>((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

    const openRazorpay = async () => {
      const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!res) {
        toast.error("Failed to load Razorpay SDK");
        return;
      }

      const options = {
        key: "rzp_test_RQbIbL7HRiuSpk", // Replace with your Razorpay Key
        amount: amount * 100,
        currency: "INR",
        name: "Food Delivery App",
        description: planTitle,
        handler: (response: any) => {
          // Important: immediately call onSuccess and onClose synchronously
          onSuccess(response.razorpay_payment_id);
          toast.success("Payment Successful!");
          onClose();
        },
        modal: {
          ondismiss: () => {
            onClose();
          },
        },
        prefill: {
          name: "User",
          email: "user@example.com",
        },
        theme: {
          color: "#F4B400",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      razorpayRef.current = rzp;

      rzp.on("payment.failed", (response: any) => {
        toast.error(`Payment Failed: ${response.error.description || ""}`);
        onClose();
      });

      rzp.open();
    };

    openRazorpay();

    return () => {
      razorpayRef.current = null;
    };
  }, [amount, planTitle, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
        <p className="text-gray-600 mb-4">Redirecting to Razorpay...</p>
        <button
          onClick={() => {
            onClose();
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;
