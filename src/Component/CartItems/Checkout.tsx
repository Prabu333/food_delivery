import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  Timestamp,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { fireDB } from "../../firebase.config";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import type { RootState } from "../../Redux/store";

interface Address {
  id?: string;
  userId: string;
  address: string;
  addressType: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  userId: string;
  itemId: string;
  foodName: string;
  foodHotel: string;
  foodPrice: number;
  foodImage: string;
  deliveryTime: number;
  discountPercentage?: number;
  quantity: number;
  deliveryFee?: number;
  userIdSeller?: string;
}

const cleanFirestoreData = (obj: any): any => {
  if (!obj) return obj;
  if (obj instanceof Timestamp) return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(cleanFirestoreData);
  if (typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) newObj[key] = cleanFirestoreData(obj[key]);
    return newObj;
  }
  return obj;
};

const Checkout: React.FC = () => {
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedItems, setUpdatedItems] = useState<CartItem[]>([]);
  const [maxDeliveryFee, setMaxDeliveryFee] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showDeliveryAnimation, setShowDeliveryAnimation] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState(0);

  const { items: cartItems } = useSelector((state: RootState) => state.selectedItems);
  const user = useSelector((state: RootState) => state.user);

  const auth = getAuth();
  const navigate = useNavigate();

  const GST = 15;
  const platformFee = 7;

 var sellerId: string | null = null;



  const fetchDefaultAddress = async (userId: string) => {
    try {
      const addressRef = collection(fireDB, "addresses");
      const q = query(addressRef, where("userId", "==", userId), where("isDefault", "==", true));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const addrData = cleanFirestoreData(snapshot.docs[0].data());
        setDefaultAddress(addrData as Address);
      } else setDefaultAddress(null);
    } catch (err) {
      console.error(err);
      setDefaultAddress(null);
    }
  };

  const fetchMaxDeliveryFee = async (cartItems: CartItem[]): Promise<number> => {
    try {
      const uniqueItemIds = [...new Set(cartItems.map((item) => item.itemId))];
      
      const sellerUserIds: string[] = [];
      for (const itemId of uniqueItemIds) {
        const foodDocRef = doc(fireDB, "foodItems", itemId);
        const foodSnap = await getDoc(foodDocRef);
        if (foodSnap.exists()) {
          const foodData = cleanFirestoreData(foodSnap.data());
          if (foodData.userId) {sellerUserIds.push(foodData.userId);
            
          }
        }
      }

      const uniqueUserIds = [...new Set(sellerUserIds)];
      const deliveryFees: number[] = [];
      for (const uid of uniqueUserIds) {
        const userRef = collection(fireDB, "users");
        const q = query(userRef, where("uid", "==", uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const userData = cleanFirestoreData(snapshot.docs[0].data());
          if (userData.deliveryFee) deliveryFees.push(userData.deliveryFee);
        }
      }

      return deliveryFees.length > 0 ? Math.max(...deliveryFees) : 0;
    } catch (err) {
      console.error(err);
      return 0;
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("No selected items. Please select from your cart.");
      navigate("/cart");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await fetchDefaultAddress(currentUser.uid);
      const maxFee = await fetchMaxDeliveryFee(cartItems);
      setMaxDeliveryFee(maxFee);

      if (user?.premium_start && user?.premium_end) {
        const startDate =
          user.premium_start instanceof Timestamp
            ? user.premium_start.toDate()
            : new Date(user.premium_start);
        const endDate =
          user.premium_end instanceof Timestamp
            ? user.premium_end.toDate()
            : new Date(user.premium_end);
        setIsPremium(new Date() >= startDate && new Date() <= endDate);
      } else setIsPremium(false);

      setUpdatedItems(cleanFirestoreData(cartItems));
      setLoading(false);
    };

    loadData();
  }, [cartItems, user]);

  if (loading)
    return <div className="p-4 text-center text-gray-600">Loading...</div>;

  const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
  const originalTotal = updatedItems.reduce(
    (sum, item) => sum + item.foodPrice * item.quantity,
    0
  );
  const discountedTotal = updatedItems.reduce(
    (sum, item) =>
      sum +
      (item.discountPercentage
        ? item.foodPrice - (item.foodPrice * item.discountPercentage) / 100
        : item.foodPrice) *
        item.quantity,
    0
  );
  const totalDiscount = originalTotal - discountedTotal;
  const totalPayable =
    discountedTotal + (isPremium ? 0 : maxDeliveryFee) + GST + platformFee;

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      console.log("update item:",updatedItems)

      for (const item of updatedItems) {
       
       
        const discountAmount = item.discountPercentage
          ? ((item.foodPrice * item.discountPercentage) / 100) * item.quantity
          : 0;

        const totalAmount =
          (item.discountPercentage
            ? (item.foodPrice - (item.foodPrice * item.discountPercentage) / 100) * item.quantity
            : item.foodPrice * item.quantity) +
          (isPremium ? 0 : maxDeliveryFee) +
          platformFee +
          GST;
    
         try {
    const foodDocRef = doc(fireDB, "foodItems", item.itemId);
    const foodSnap = await getDoc(foodDocRef);

    if (foodSnap.exists()) {
      const data = foodSnap.data();
      sellerId = data.userId || null; // assign directly
      console.log("Seller ID assigned:", sellerId);
    } else {
      console.warn(`Food item not found: ${item.itemId}`);
      sellerId = null;
    }
  } catch (error) {
    console.error("Error fetching seller ID:", error);
    sellerId = null;
  }
        const orderData: any = {
          itemId: item.itemId,
          foodName: item.foodName,
          foodHotel: item.foodHotel,
          foodPrice: item.foodPrice,
          quantity: item.quantity,
          discountAmount,
          deliveryFee: isPremium ? 0 : maxDeliveryFee,
          platformFee,
          GST,
          totalAmount,
          food_img:item.foodImage,
          seller_id:sellerId,
          userId: currentUser.uid,
          paymentId,
          orderDate: new Date().toISOString(),
        };

        if (item.userIdSeller) orderData.itemUserId = item.userIdSeller;

        await addDoc(collection(fireDB, "orders"), orderData);

        const cartQuery = query(
          collection(fireDB, "cart"),
          where("itemId", "==", item.itemId),
          where("userId", "==", currentUser.uid)
        );
        const cartSnapshot = await getDocs(cartQuery);
        for (const docSnap of cartSnapshot.docs) {
          await deleteDoc(doc(fireDB, "cart", docSnap.id));
        }
      }

      // Get max delivery time among all ordered items
      const maxTime = Math.max(...updatedItems.map((item) => item.deliveryTime || 30));
      setDeliveryTime(maxTime);
      setShowDeliveryAnimation(true);

      toast.success("✅ Order Placed Successfully!");

      // Redirect to /orders after showing animation for 10 seconds
      setTimeout(() => {
        setUpdatedItems([]);
        setShowDeliveryAnimation(false);
        navigate("/orders");
      }, 10000); // 10 seconds
    } catch (err) {
      console.error("🔥 Order creation failed:", err);
      toast.error("Failed to place order. Try again.");
    }
  };

  const handlePayment = async () => {
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

    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
      toast.error("Razorpay SDK failed to load. Are you online?");
      return;
    }

    const options = {
      key: "rzp_test_RQbIbL7HRiuSpk",
      amount: totalPayable * 100,
      currency: "INR",
      name: "Food Delivery",
      description: "Order Payment",
      handler: function (response: any) {
        handlePaymentSuccess(response.razorpay_payment_id);
      },
      prefill: {
        name: user?.firstName || "",
        email: user?.email || "",
        contact: user?.mobile || "",
      },
      theme: { color: "#4CAF50" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  // ✅ Delivery Animation screen
  if (showDeliveryAnimation) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center bg-gradient-to-b from-green-100 to-green-50 rounded-2xl animate-fadeIn">
        <img
          src="https://cdn-icons-png.flaticon.com/512/1048/1048315.png"
          alt="Delivery Animation"
          className="w-36 h-36 mb-5 animate-bounce"
        />
        <h2 className="text-2xl font-bold text-green-700 mb-2">
          🎉 Order Placed Successfully!
        </h2>
        <p className="text-gray-700 text-lg">
          Your food will be delivered within{" "}
          <span className="font-bold text-green-700">{deliveryTime} minutes</span>.
        </p>
        {defaultAddress && (
          <p className="mt-4 text-gray-600 text-sm">
            Delivery to: {defaultAddress.address}
          </p>
        )}
        <p className="mt-4 text-gray-500 text-sm">Redirecting to your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded-2xl p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Place Order</h2>

      {/* Address Section */}
      <div className="border rounded-xl p-4 mb-4 bg-gray-50">
        <h3 className="text-lg font-medium mb-2">Delivery Address</h3>
        {defaultAddress ? (
          <>
            <p className="text-gray-700 mb-2">
              <strong>{defaultAddress.addressType}:</strong> {defaultAddress.address}
            </p>
            <button
              onClick={() => navigate("/address")}
              className="text-blue-600 hover:underline text-sm"
            >
              Change Address
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-500">No default address found.</p>
            <button
              onClick={() => navigate("/address")}
              className="text-blue-600 hover:underline text-sm"
            >
              Add Address
            </button>
          </>
        )}
      </div>

      {/* Summary Section */}
      <div className="border rounded-xl p-4 bg-gray-50">
        <h3 className="text-lg font-medium mb-3">Order Summary</h3>
        <div className="flex justify-between py-1 text-gray-700">
          <span>Total Items</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex justify-between py-1 text-gray-700">
          <span>Original Price</span>
          <span>₹{originalTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-1 text-green-600">
          <span>Discount</span>
          <span>- ₹{totalDiscount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-1 text-gray-700">
          <span>Delivery Fee</span>
          {isPremium ? (
            <span>
              <span className="line-through text-gray-400">₹{maxDeliveryFee.toFixed(2)}</span>{" "}
              <span className="text-green-600 font-semibold">₹0.00</span>
            </span>
          ) : (
            <span>₹{maxDeliveryFee.toFixed(2)}</span>
          )}
        </div>
        <div className="flex justify-between py-1 text-gray-700">
          <span>GST (Tax)</span>
          <span>₹{GST.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-1 text-gray-700">
          <span>Platform Fees</span>
          <span>₹{platformFee.toFixed(2)}</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between font-semibold text-lg">
          <span>Total Payable</span>
          <span>₹{totalPayable.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handlePayment}
        className="w-full bg-green-600 text-white py-2 rounded-xl mt-5 hover:bg-green-700"
      >
        Proceed to Payment
      </button>
    </div>
  );
};

export default Checkout;
