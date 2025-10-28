import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { fireDB } from "../../firebase.config";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../Redux/store";

const FooterCart: React.FC<{ cartCount: number }> = ({ cartCount }) => {
  if (cartCount === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 w-full bg-purple-600/90 p-4 flex justify-between items-center z-50">
      <div className="text-white font-bold">
        {cartCount} item{cartCount > 1 ? "s" : ""} in Cart
      </div>
      <button
        onClick={() => window.location.assign("/cart")}
        className="bg-white text-purple-700 font-bold px-5 py-2 rounded-lg hover:bg-gray-100 transition"
      >
        Go to Cart
      </button>
    </div>
  );
};

interface FoodItem {
  id: string;
  foodName: string;
  foodHotel: string;
  foodPrice: number;
  foodImage: string;
  deliveryTime: number;
  discountPercentage?: number;
  rating?: number;
  foodGroup?: string;
  foodType?: string;
}

interface FoodPageProps {
  searchResult: string;
}

const FoodPage: React.FC<FoodPageProps> = ({ searchResult }) => {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filtered, setFiltered] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});

  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);
  const userId = user?.uid || null;

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(fireDB, "foodItems"));
        const list: FoodItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FoodItem[];
        setItems(list);
        setFiltered(list);
      } catch (err) {
        console.error("Error fetching items:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      if (!userId) {
        setCart({});
        return;
      }
      try {
        const q = query(collection(fireDB, "cart"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const cartData: Record<string, number> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          cartData[data.itemId] = data.quantity;
        });
        setCart(cartData);
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };
    fetchCart();
  }, [userId]);

  const handleAdd = async (item: FoodItem) => {
    if (!userId) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

    const newQty = (cart[item.id] || 0) + 1;
    setCart({ ...cart, [item.id]: newQty });

    try {
      await setDoc(doc(fireDB, "cart", `${userId}_${item.id}`), {
        userId,
        itemId: item.id,
        quantity: newQty,
        foodName: item.foodName,
        foodHotel: item.foodHotel,
        foodImage: item.foodImage,
        foodPrice: item.foodPrice,
        discountPercentage: item.discountPercentage || 0,
        deliveryTime: item.deliveryTime,
      });
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  };

  const handleRemove = async (item: FoodItem) => {
    if (!userId) {
      toast.error("Please login to manage cart");
      navigate("/login");
      return;
    }

    const currentQty = cart[item.id] || 0;
    if (currentQty <= 0) return;

    const newQty = currentQty - 1;
    setCart({ ...cart, [item.id]: newQty });

    try {
      if (newQty > 0) {
        await setDoc(doc(fireDB, "cart", `${userId}_${item.id}`), {
          userId,
          itemId: item.id,
          quantity: newQty,
          foodName: item.foodName,
          foodHotel: item.foodHotel,
          foodImage: item.foodImage,
          foodPrice: item.foodPrice,
          discountPercentage: item.discountPercentage || 0,
          deliveryTime: item.deliveryTime,
        });
      } else {
        await deleteDoc(doc(fireDB, "cart", `${userId}_${item.id}`));
      }
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  };

  useEffect(() => {
    const data = items.filter((item) =>
      [item.foodName, item.foodHotel].join(" ").toLowerCase().includes(searchResult.toLowerCase())
    );
    setFiltered(data);
  }, [searchResult, items]);

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="w-full min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      {/* 💫 Stylish Title Section */}
      <div className="relative text-center mb-6">
        <div className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600/60 via-pink-500/60 to-orange-400/60 backdrop-blur-md shadow-md">
          <h2 className="text-3xl font-extrabold text-white tracking-wide uppercase drop-shadow-lg">
            🍴 Food Items
          </h2>
        </div>
      </div>

      {loading ? (
        <p className="text-center">Loading items...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500">No items found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full">
          {filtered.map((item) => {
            const hasDiscount = item.discountPercentage && item.discountPercentage > 0;
            const discountedPrice = hasDiscount
              ? item.foodPrice - (item.foodPrice * (item.discountPercentage || 0)) / 100
              : item.foodPrice;
            const qty = cart[item.id] || 0;

            return (
              <Link to={`/item/${item.id}`}>
              <div
                key={item.id}
                className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition flex flex-col"
              >
                 
                <img
                  src={item.foodImage}
                  alt={item.foodName}
                  className="w-full h-44 object-cover"
                />
                
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-gray-800">{item.foodName}</h3>
                  <p className="text-sm text-gray-600">{item.foodHotel}</p>
                  <p className="text-xs text-gray-500">Delivery: {item.deliveryTime} mins</p>

                  <div className="mt-2 flex items-center gap-2">
                    {hasDiscount ? (
                      <>
                        <p className="text-gray-400 text-sm line-through">
                          ₹{item.foodPrice.toFixed(2)}
                        </p>
                        <p className="font-bold text-green-600">
                          ₹{discountedPrice.toFixed(2)}
                        </p>
                        <span className="text-red-500 text-sm">
                          ({item.discountPercentage}% OFF)
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-green-600">
                        ₹{item.foodPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {item.rating && (
                    <p className="text-yellow-600 text-sm mt-1">
                      ⭐ {item.rating.toFixed(1)}
                    </p>
                  )}

                  {/* Cart Controls */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => handleRemove(item)}
                      className="px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      -
                    </button>
                    <span className="font-bold text-lg">{qty}</span>
                    <button
                      onClick={() => handleAdd(item)}
                      className="px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              </Link>
            );
          })}
        </div>
      )}

      <FooterCart cartCount={cartCount} />
    </div>
  );
};

export default FoodPage;
