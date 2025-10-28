import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { fireDB } from "../../../firebase.config";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

interface Order {
  id: string;
  userId: string;
  itemName: string;
  itemImage: string;
  hotelName: string;
  price: number;
  quantity: number;
  orderDate: string;
  totalAmount: number;
  discountAmount?: number;
  itemId: string;
}

const TotalOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!user) {
          toast.error("Please log in to view your orders");
          return;
        }

        const orderRef = collection(fireDB, "orders");
        const q = query(orderRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const orderData: Order[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const formattedDate = data.orderDate
            ? new Date(data.orderDate).toLocaleDateString("en-GB")
            : "N/A";
          return {
            id: doc.id,
            userId: data.userId,
            itemName: data.foodName || data.itemName || "Unknown Item",
            itemImage: data.food_img || data.itemImage || "",
            hotelName: data.foodHotel || data.hotelName || "Unknown Hotel",
            price: data.foodPrice || data.price || 0,
            quantity: data.quantity || 1,
            totalAmount: data.totalAmount || data.foodPrice * data.quantity || 0,
            discountAmount: data.discountAmount || 0,
            orderDate: formattedDate,
            itemId: data.itemId || data.ItemId || "",
          };
        });

        setOrders(orderData);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-600">
        Loading your orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">No orders found.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 px-4">
      {/* Title */}
      <h2
        className="
          text-2xl font-bold text-white text-center
          bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
          py-3 rounded-xl shadow-md mb-6
          md:text-3xl md:py-4
          transition-all duration-300
        "
      >
        Your Orders
      </h2>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => {
          const discountedTotal =
            order.discountAmount && order.discountAmount > 0
              ? order.totalAmount - order.discountAmount
              : order.totalAmount;

          return (
            <Link
              to={`/item/${order.itemId}`}
              key={order.id}
              className="
                flex flex-col sm:flex-row sm:items-center sm:justify-between
                p-4 bg-white shadow-md rounded-xl
                transform transition-all duration-300 ease-in-out
                hover:scale-105 active:scale-105 cursor-pointer
              "
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full">
                <img
                  src={order.itemImage}
                  alt={order.itemName}
                  className="
                    w-full h-40 sm:w-24 sm:h-24 rounded-lg object-cover
                    mb-3 sm:mb-0 transition-all duration-300
                  "
                />

                <div className="flex flex-col justify-between w-full">
                  <div>
                    <h3 className="text-lg font-semibold sm:text-xl">
                      {order.itemName}
                    </h3>
                    <p className="text-sm text-gray-500 sm:text-base">
                      {order.hotelName}
                    </p>
                    <p className="text-sm text-gray-400">
                      Ordered on: {order.orderDate}
                    </p>
                  </div>

                  <div className="text-right mt-3 sm:mt-0">
                    {order.discountAmount && order.discountAmount > 0 ? (
                      <div>
                        <p className="text-gray-500 line-through text-sm">
                          ₹{order.totalAmount}
                        </p>
                        <p className="text-green-600 font-bold text-lg">
                          ₹{discountedTotal}
                        </p>
                        <p className="text-xs text-gray-400">
                          Saved ₹{order.discountAmount}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-800 font-semibold text-lg">
                        ₹{order.totalAmount}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Qty: {order.quantity}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default TotalOrders;
