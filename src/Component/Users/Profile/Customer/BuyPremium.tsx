import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { fireDB } from "../../../../firebase.config";
import { toast } from "react-toastify";
import PaymentModal from "../../../PaymentGateway/PaymentModal";

interface Plan {
  id: string;
  title: string;
  price: number;
  months: number;
}

const plans: Plan[] = [
  { id: "1", title: "1 Month Plan", price: 99, months: 1 },
  { id: "3", title: "3 Month Plan", price: 200, months: 3 },
  { id: "6", title: "6 Month Plan", price: 379, months: 6 },
  { id: "12", title: "1 Year Plan", price: 500, months: 12 },
];

const BuyPremium: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [userPremium, setUserPremium] = useState<{
    start_date: string;
    end_date: string;
  } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  // 🎯 Fetch user premium info
  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      const ref = doc(fireDB, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data.premium_start && data.premium_end) {
          setUserPremium({
            start_date: data.premium_start,
            end_date: data.premium_end,
          });
        }
      }
    };
    fetchUser();
  }, [user]);

  // 💳 After payment success
  const handlePaymentSuccess = async (paymentId: string) => {
    if (!selectedPlan || !user) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + selectedPlan.months);

    try {
      const ref = doc(fireDB, "users", user.uid);
      await updateDoc(ref, {
        premium_start: startDate.toISOString(),
        premium_end: endDate.toISOString(),
        razorpay_payment_id: paymentId,
      });
      toast.success("🎉 Premium Activated Successfully!");
      setUserPremium({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      setSelectedPlan(null);
      setShowPaymentModal(false);
    } catch {
      toast.error("Failed to update premium plan");
    }
  };

  const isPremiumActive =
    userPremium && new Date(userPremium.end_date) > new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-white p-8 flex flex-col items-center">
      <h2 className="text-4xl font-extrabold text-yellow-700 mb-8 drop-shadow-md">
        🌟 Buy Premium Plan
      </h2>

      {isPremiumActive ? (
        <div className="bg-green-100 text-green-800 p-5 rounded-xl shadow-md w-full max-w-xl text-center">
          <p className="text-lg font-semibold">
            You are already a Premium User until{" "}
            <strong>
              {new Date(userPremium!.end_date).toLocaleDateString("en-IN")}
            </strong>
          </p>
        </div>
      ) : (
        <>
          {/* 💳 Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-8">
            {plans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-6 rounded-2xl shadow-lg cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                    isSelected
                      ? "bg-yellow-500 text-white ring-4 ring-yellow-300 scale-105"
                      : "bg-white border border-yellow-300 hover:bg-yellow-100"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
                  <p className="text-2xl font-extrabold mb-3">
                    ₹{plan.price}
                  </p>
                  <p className="text-sm opacity-80">
                    Duration: {plan.months} month{plan.months > 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 🟨 Buy Button */}
          <div className="text-center">
            <button
              disabled={!selectedPlan}
              onClick={() => setShowPaymentModal(true)}
              className={`px-8 py-3 rounded-xl text-lg font-semibold shadow-lg transition-all ${
                selectedPlan
                  ? "bg-yellow-500 text-white hover:bg-yellow-600 hover:scale-105"
                  : "bg-gray-400 text-white cursor-not-allowed"
              }`}
            >
              {selectedPlan
                ? `Buy ${selectedPlan.title}`
                : "Select a Plan to Continue"}
            </button>
          </div>
        </>
      )}

      {/* Razorpay Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          amount={selectedPlan.price}
          planTitle={selectedPlan.title}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default BuyPremium;
