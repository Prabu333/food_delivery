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
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setSelectedItems } from "../../Redux/SeletedItemSlice"; // 👈 import Redux action

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
  const dispatch = useDispatch(); // 👈 Redux dispatcher

  // Fetch cart when user logs in or out
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

  // Fetch cart items from Firestore for the logged-in user
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

  // Increment quantity
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

  // Decrement quantity
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

  // Remove item completely
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

  // Toggle checkbox selection
  const handleSelect = (id: string) => {
    setSelectedItemsState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate selected total
  const totalSelected = cartItems.reduce((acc, item) => {
    if (!selectedItems[item.id]) return acc;
    const hasDiscount = item.discountPercentage && item.discountPercentage > 0;
    const finalPrice = hasDiscount
      ? item.foodPrice - (item.foodPrice * (item.discountPercentage || 0)) / 100
      : item.foodPrice;
    return acc + finalPrice * item.quantity;
  }, 0);

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  // Proceed to checkout
  const handleProceedToBuy = () => {
    if (selectedCount === 0) {
      alert("Please select at least one item to proceed.");
      return;
    }

    const selectedCartItems = cartItems.filter((i) => selectedItems[i.id]);

    // 👇 Save to Redux
    dispatch(setSelectedItems(selectedCartItems));

    // 👇 Navigate to checkout (no need to pass via state)
    navigate("/checkout");
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-32">
      <h2 className="text-2xl font-bold mb-4 text-center md:text-left">🛒 My Cart</h2>

      {loading ? (
        <p className="text-center">Loading cart...</p>
      ) : cartItems.length === 0 ? (
        <p className="text-center text-gray-500">No items in cart.</p>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => {
              const hasDiscount = item.discountPercentage && item.discountPercentage > 0;
              const discountedPrice = hasDiscount
                ? item.foodPrice - (item.foodPrice * (item.discountPercentage || 0)) / 100
                : item.foodPrice;

              return (
                <div
                  key={item.id}
                  className="w-full flex flex-col sm:flex-row items-start gap-4 p-4 bg-white shadow rounded-lg relative group"
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={!!selectedItems[item.id]}
                    onChange={() => handleSelect(item.id)}
                    className="w-5 h-5 self-start mt-1"
                  />

                  {/* Image */}
                  <img
                    src={item.foodImage}
                    alt={item.foodName}
                    className="w-full sm:w-20 h-40 sm:h-20 object-cover rounded-lg"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between w-full">
                    <div>
                      <h3 className="font-bold">{item.foodName}</h3>
                      <p className="text-sm text-gray-600">{item.foodHotel}</p>
                      <p className="text-xs text-gray-500">
                        Delivery: {item.deliveryTime} mins
                      </p>
                    </div>

                    {/* Price & Quantity */}
                    <div className="mt-2 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 w-full">
                      <span
                        className={`font-semibold ${
                          hasDiscount ? "text-green-600" : "text-black"
                        }`}
                      >
                        ₹{(discountedPrice * item.quantity).toFixed(2)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrement(item)}
                          className="p-1 bg-red-100 rounded hover:bg-red-200"
                        >
                          <FiMinus className="text-red-600" />
                        </button>
                        <span className="font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => handleIncrement(item)}
                          className="p-1 bg-green-100 rounded hover:bg-green-200"
                        >
                          <FiPlus className="text-green-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item)}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition"
                  >
                    <FiTrash className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Total Section */}
          <div className="mt-4 p-4 bg-purple-50 rounded-lg shadow flex justify-between items-center">
            <span className="font-bold text-purple-700">
              Selected ({selectedCount} item{selectedCount !== 1 ? "s" : ""})
            </span>
            <span className="font-bold text-green-600">
              ₹{totalSelected.toFixed(2)}
            </span>
          </div>

          {/* Proceed Button */}
          <div className="mt-4 flex justify-center sm:fixed sm:bottom-4 sm:left-0 sm:w-full z-50">
            <button
              onClick={handleProceedToBuy}
              disabled={selectedCount === 0}
              className={`bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition ${
                selectedCount === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Proceed to Buy ({selectedCount} item{selectedCount !== 1 ? "s" : ""}) - ₹
              {totalSelected.toFixed(2)}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartItems;
