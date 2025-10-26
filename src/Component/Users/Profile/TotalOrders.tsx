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
         console.log("data:",data)
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
            itemId: data.itemId || data.ItemId || ""

             
          };
        });
        console.log("orders:",orderData)

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
      <div className="text-center py-10 text-gray-500">
        No orders found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 px-4">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Your Orders
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => {
          const discountedTotal =
            order.discountAmount && order.discountAmount > 0
              ? order.totalAmount - order.discountAmount
              : order.totalAmount;

          return (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 bg-white shadow-md rounded-xl hover:shadow-lg transition"
            >
              <div className="flex items-center space-x-4">
                <Link to={`/item/${order.itemId}`}>
                <img
                  src={order.itemImage}
                  alt={order.itemName}
                  className="w-20 h-20 rounded-lg object-cover"
                />
            
                <div>
                  <h3 className="text-lg font-semibold">{order.itemName}</h3>
                  <p className="text-sm text-gray-500">{order.hotelName}</p>
                  <p className="text-sm text-gray-400">
                    Ordered on: {order.orderDate}
                  </p>
                </div>
                </Link>
              </div>

              <div className="text-right">
                {order.discountAmount && order.discountAmount > 0 ? (
                  <div>
                    <p className="text-gray-500 line-through text-sm">
                      ₹{order.totalAmount}
                    </p>
                    <p className="text-green-600 font-bold">
                      ₹{discountedTotal}
                    </p>
                    <p className="text-xs text-gray-400">
                      Saved ₹{order.discountAmount}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-800 font-semibold">
                    ₹{order.totalAmount}
                  </p>
                )}
                <p className="text-sm text-gray-500">Qty: {order.quantity}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TotalOrders;
