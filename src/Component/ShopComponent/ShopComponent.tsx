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
import { FiFilter } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import type { RootState } from "../../Redux/store";

const FooterCart: React.FC<{ cartCount: number }> = ({ cartCount }) => {
  if (cartCount === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 w-full bg-purple-600/80 p-4 flex justify-between items-center z-50 backdrop-blur-md">
      <div className="text-white font-bold text-lg drop-shadow-sm">
        {cartCount} item{cartCount > 1 ? "s" : ""} in Cart
      </div>
      <Link
        to="/cart"
        className="bg-white/90 text-purple-700 font-bold px-4 py-2 rounded-lg hover:bg-white shadow-md"
      >
        Go to Cart
      </Link>
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

interface ShopProps {
  searchResult: string;
}
type SortField = "foodPrice" | "deliveryTime" | "rating" | "discountPercentage";
type SortOrder = "asc" | "desc";

const Shop: React.FC<ShopProps> = ({ searchResult }) => {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filtered, setFiltered] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [groupFilter, setGroupFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("foodPrice");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);

  // Fetch cart
  useEffect(() => {
    if (user?.uid) {
      fetchCart(user.uid);
    } else {
      setCart({});
    }
  }, [user?.uid]);

  const fetchCart = async (uid: string) => {
    try {
      const q = query(collection(fireDB, "cart"), where("userId", "==", uid));
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

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(fireDB, "foodItems"));
        const list = snapshot.docs.map((doc) => ({
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

  const handleAdd = async (item: FoodItem) => {
    if (!user?.uid) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

    const newQty = (cart[item.id] || 0) + 1;
    setCart({ ...cart, [item.id]: newQty });

    try {
      await setDoc(doc(fireDB, "cart", `${user.uid}_${item.id}`), {
        userId: user.uid,
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
    if (!user?.uid) {
      toast.error("Please login to manage cart");
      return;
    }

    const currentQty = cart[item.id] || 0;
    if (currentQty <= 0) return;

    const newQty = currentQty - 1;
    setCart({ ...cart, [item.id]: newQty });

    try {
      if (newQty > 0) {
        await setDoc(doc(fireDB, "cart", `${user.uid}_${item.id}`), {
          userId: user.uid,
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
        await deleteDoc(doc(fireDB, "cart", `${user.uid}_${item.id}`));
      }
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  };

  // Filtering and sorting
  useEffect(() => {
    let data = [...items];
    if (groupFilter) data = data.filter((i) => i.foodGroup === groupFilter);
    if (searchResult)
      data = data.filter((item) =>
        [item.foodName, item.foodHotel]
          .join(" ")
          .toLowerCase()
          .includes(searchResult.toLowerCase())
      );
    if (typeFilter) data = data.filter((i) => i.foodType === typeFilter);
    data.sort((a, b) => {
      const valA = a[sortField] || 0;
      const valB = b[sortField] || 0;
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
    setFiltered(data);
  }, [groupFilter, searchResult, typeFilter, sortField, sortOrder, items]);

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* 🌈 Stylish Header */}
      <div className="relative mb-8 text-center py-6 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-400 to-orange-400 text-white font-bold text-4xl shadow-lg tracking-wide backdrop-blur-lg">
        <div className="flex justify-center items-center gap-3">
          <FiFilter className="text-white text-4xl animate-spin-slow drop-shadow-md" />
          <span className="font-serif italic drop-shadow-md">
            Welcome to Shop
          </span>
        </div>
        <p className="text-sm text-white/80 mt-2 font-light">
          Discover delicious food with amazing offers 🍔✨
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="border p-2 rounded focus:ring-2 focus:ring-purple-400"
        >
          <option value="">All Groups</option>
          <option value="Meals">Meals</option>
          <option value="Chicken">Chicken</option>
          <option value="Mutton">Mutton</option>
          <option value="Fish">Fish</option>
          <option value="Cake">Cake</option>
          <option value="Snacks">Snacks</option>
          <option value="Cooldrinks">Cooldrinks</option>
          <option value="Tiffin">Tiffin</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border p-2 rounded focus:ring-2 focus:ring-purple-400"
        >
          <option value="">All Types</option>
          <option value="Veg">Veg</option>
          <option value="Non-Veg">Non-Veg</option>
        </select>

        <div className="flex gap-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="border p-2 rounded flex-1 focus:ring-2 focus:ring-purple-400"
          >
            <option value="foodPrice">Price</option>
            <option value="deliveryTime">Delivery Time</option>
            <option value="rating">Rating</option>
            <option value="discountPercentage">Discount</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="border p-2 rounded focus:ring-2 focus:ring-purple-400"
          >
            <option value="asc">⬆️ Asc</option>
            <option value="desc">⬇️ Desc</option>
          </select>
        </div>
      </div>

      {/* Food Grid */}
      {loading ? (
        <p className="text-center">Loading items...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500">No items found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((item) => {
            const hasDiscount =
              item.discountPercentage && item.discountPercentage > 0;
            const discountedPrice = hasDiscount
              ? item.foodPrice -
                (item.foodPrice * (item.discountPercentage || 0)) / 100
              : item.foodPrice;
            const qty = cart[item.id] || 0;

            return (
             <div
               key={item.id}>
                <div className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-[1.02] backdrop-blur-sm">
                  <Link to={`/item/${item.id}`}>
                  <img
                    src={item.foodImage}
                    alt={item.foodName}
                    className="w-full h-44 object-cover"
                  />
                  </Link>
                  <div className="p-4">
                    <Link to={`/item/${item.id}`}>
                    <h3 className="font-semibold text-lg text-purple-700">
                      {item.foodName}
                    </h3>
                    <p className="text-sm text-gray-600">{item.foodHotel}</p>
                    <p className="text-xs text-gray-500">
                      ⏱️ {item.deliveryTime} mins
                    </p>
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                      {hasDiscount ? (
                        <>
                          <p className="text-gray-500 text-sm line-through">
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
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemove(item);
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        -
                      </button>
                      <span className="font-bold text-lg">{qty}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAdd(item);
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
            </div>
            );
          })}
        </div>
      )}

      <FooterCart cartCount={cartCount} />
    </div>
  );
};

export default Shop;
