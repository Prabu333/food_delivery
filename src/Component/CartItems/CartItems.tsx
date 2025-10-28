import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  deleteDoc,
} from "firebase/firestore";
import { fireDB } from "../../firebase.config";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FiPlus, FiMinus, FiTrash } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setSelectedItems } from "../../Redux/SeletedItemSlice";

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
}

const CartItems: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItemsState] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const auth = getAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchCart(user.uid);
      } else {
        setCartItems([]);
        setSelectedItemsState({});
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCart = async (uid: string) => {
    try {
      setLoading(true);
      const q = query(collection(fireDB, "cart"), where("userId", "==", uid));
      const snapshot = await getDocs(q);
      const list: CartItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CartItem[];

      const filteredList = list.filter((item) => item.quantity > 0);
      setCartItems(filteredList);
      setSelectedItemsState(Object.fromEntries(filteredList.map((i) => [i.id, false])));
    } catch (err) {
      console.error("Error fetching cart items:", err);
      alert("Failed to load cart. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async (item: CartItem) => {
    try {
      const newQty = item.quantity + 1;
      const ref = doc(fireDB, "cart", item.id);
      await updateDoc(ref, { quantity: newQty });
      setCartItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
      );
    } catch (err) {
      console.error("Failed to increment quantity", err);
      alert("Failed to update cart. Please try again.");
    }
  };

  const handleDecrement = async (item: CartItem) => {
    try {
      const newQty = item.quantity - 1;
      const ref = doc(fireDB, "cart", item.id);
      if (newQty <= 0) {
        await deleteDoc(ref);
        setCartItems((prev) => prev.filter((i) => i.id !== item.id));
        setSelectedItemsState((prev) => {
          const updated = { ...prev };
          delete updated[item.id];
          return updated;
        });
      } else {
        await updateDoc(ref, { quantity: newQty });
        setCartItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
        );
      }
    } catch (err) {
      console.error("Failed to decrement quantity", err);
      alert("Failed to update cart. Please try again.");
    }
  };

  const handleRemove = async (item: CartItem) => {
    try {
      const ref = doc(fireDB, "cart", item.id);
      await deleteDoc(ref);
      setCartItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelectedItemsState((prev) => {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      });
    } catch (err) {
      console.error("Failed to remove item", err);
      alert("Failed to remove item. Please try again.");
    }
  };

  const handleSelect = (id: string) => {
    setSelectedItemsState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalSelected = cartItems.reduce((acc, item) => {
    if (!selectedItems[item.id]) return acc;
    const hasDiscount = item.discountPercentage && item.discountPercentage > 0;
    const finalPrice = hasDiscount
      ? item.foodPrice - (item.foodPrice * (item.discountPercentage || 0)) / 100
      : item.foodPrice;
    return acc + finalPrice * item.quantity;
  }, 0);

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  const handleProceedToBuy = () => {
    if (selectedCount === 0) {
      alert("Please select at least one item to proceed.");
      return;
    }

    const selectedCartItems = cartItems.filter((i) => selectedItems[i.id]);
    dispatch(setSelectedItems(selectedCartItems));
    navigate("/checkout");
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-32">
      {/* 🛒 Styled Heading */}
      <h2
        className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r 
                   from-purple-600 via-pink-500 to-orange-400 
                   text-transparent bg-clip-text tracking-wide drop-shadow-md"
      >
        🛍️ My Cart
      </h2>

      <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-400 mx-auto rounded-full mb-8" />

      {loading ? (
        <p className="text-center text-gray-600 animate-pulse">Loading cart...</p>
      ) : cartItems.length === 0 ? (
        <p className="text-center text-gray-500 italic">Your cart is empty 😢</p>
      ) : (
        <>
          <div className="grid gap-4">
            {cartItems.map((item) => {
              const hasDiscount = item.discountPercentage && item.discountPercentage > 0;
              const discountedPrice = hasDiscount
                ? item.foodPrice - (item.foodPrice * (item.discountPercentage || 0)) / 100
                : item.foodPrice;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start gap-4 p-4 
                             bg-gradient-to-br from-white via-purple-50 to-purple-100 
                             shadow-lg rounded-2xl 
                             transition-transform transform-gpu 
                             hover:scale-105 active:scale-105 
                             duration-300 ease-in-out"
                >
                  <input
                    type="checkbox"
                    checked={!!selectedItems[item.id]}
                    onChange={() => handleSelect(item.id)}
                    className="w-5 h-5 mt-1 accent-purple-600"
                  />

                  <Link to={`/item/${item.itemId}`}>
                    <img
                      src={item.foodImage}
                      alt={item.foodName}
                      className="w-full sm:w-24 h-44 sm:h-24 object-cover rounded-xl shadow-md border border-purple-200"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between">
                    <Link to={`/item/${item.itemId}`}>
                      <h3 className="text-lg font-semibold text-purple-800">{item.foodName}</h3>
                      <p className="text-sm text-gray-600">{item.foodHotel}</p>
                      <p className="text-xs text-gray-500">
                        ⏱ Delivery: {item.deliveryTime} mins
                      </p>
                    </Link>

                    <div className="mt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span
                        className={`font-bold ${
                          hasDiscount ? "text-green-600" : "text-gray-800"
                        }`}
                      >
                        ₹{(discountedPrice * item.quantity).toFixed(2)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrement(item)}
                          className="p-2 bg-red-100 rounded-full hover:bg-red-200"
                        >
                          <FiMinus className="text-red-600" />
                        </button>
                        <span className="font-semibold text-purple-700">{item.quantity}</span>
                        <button
                          onClick={() => handleIncrement(item)}
                          className="p-2 bg-green-100 rounded-full hover:bg-green-200"
                        >
                          <FiPlus className="text-green-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(item)}
                    className="absolute right-4 top-4 opacity-70 hover:opacity-100 transition"
                  >
                    <FiTrash className="text-gray-500 hover:text-red-600" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* 🧾 Total Section */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-50 rounded-xl shadow flex justify-between items-center border border-purple-200">
            <span className="font-bold text-purple-800">
              Selected ({selectedCount} item{selectedCount !== 1 ? "s" : ""})
            </span>
            <span className="font-extrabold text-green-700 text-lg">
              ₹{totalSelected.toFixed(2)}
            </span>
          </div>

          {/* ✅ Proceed Button */}
          <div className="mt-6 flex justify-center fixed bottom-4 left-0 w-full px-4 z-50">
            <button
              onClick={handleProceedToBuy}
              disabled={selectedCount === 0}
              className={`w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 
                          text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 
                          hover:scale-[1.03] hover:shadow-2xl ${
                            selectedCount === 0 ? "opacity-50 cursor-not-allowed" : ""
                          }`}
            >
              Proceed to Buy ({selectedCount}) – ₹{totalSelected.toFixed(2)}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartItems;
