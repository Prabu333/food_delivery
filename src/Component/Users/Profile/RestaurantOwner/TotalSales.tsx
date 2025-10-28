import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
} from "firebase/firestore";
import { fireDB } from "../../../../firebase.config";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";

interface Order {
  id: string;
  userId: string;
  sellerId: string;
  itemName: string;
  itemImage: string;
  totalAmount: number;
  discountAmount?: number;
  orderDate: string;
  revenue: number;
  orderBy: string;
  itemId:string;
}

const TotalSales: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!user) {
          toast.error("Please log in as a restaurant owner");
          return;
        }

        const orderRef = collection(fireDB, "orders");
        const q = query(orderRef, where("seller_id", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const fetchedOrders: Order[] = [];

        for (const orderDoc of querySnapshot.docs) {
          const data = orderDoc.data();

          const formattedDate = data.orderDate
            ? new Date(data.orderDate).toLocaleDateString("en-GB")
            : "N/A";

          const discount = data.discountAmount || 0;
          const revenue = (data.totalAmount || 0) - discount;

          let orderByName = "Unknown User";
          if (data.userId) {
            try {
              const userRef = doc(fireDB, "users", data.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                const firstName = userData.firstName || "";
                const lastName = userData.lastName || "";
                orderByName = `${firstName} ${lastName}`.trim() || "Unnamed User";
              }
            } catch (err) {
              console.warn("Error fetching user info:", err);
            }
          }

          fetchedOrders.push({
            id: orderDoc.id,
            userId: data.userId,
            sellerId: data.seller_id,
            itemName: data.foodName || data.itemName || "Unknown Item",
            itemImage: data.food_img || data.itemImage || "",
            totalAmount: data.totalAmount || 0,
            discountAmount: discount,
            orderDate: formattedDate,
            revenue,
            orderBy: orderByName,
            itemId:data.itemId
          });
        }

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching restaurant orders:", error);
        toast.error("Failed to load restaurant orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-600">
        Loading restaurant orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No orders found for your restaurant.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-6 px-4">
      {/* 🌈 Updated Title */}
      <h2 className="text-3xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-[Poppins] tracking-wide">
        Restaurant Orders
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-4 bg-white shadow-md rounded-xl 
                       transition-all duration-300 ease-in-out transform 
                       hover:scale-105 hover:shadow-2xl 
                       active:scale-105 focus:scale-105"
          >
            <div className="flex items-center space-x-4">
              
              <img
                src={order.itemImage}
                alt={order.itemName}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold">{order.itemName}</h3>
                <p className="text-sm text-gray-500">
                  Ordered by: <span className="font-medium">{order.orderBy}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Ordered on: {order.orderDate}
                </p>
              </div>
            </div>

            <div className="text-right">
              {order.discountAmount && order.discountAmount > 0 ? (
                <div>
                  <p className="text-gray-500 line-through text-sm">
                    ₹{order.totalAmount}
                  </p>
                  <p className="text-green-600 font-bold">
                    ₹{order.revenue}{" "}
                    <span className="text-gray-500 text-sm">(Revenue)</span>
                  </p>
                </div>
              ) : (
                <p className="text-gray-800 font-semibold">
                  ₹{order.revenue}{" "}
                  <span className="text-gray-500 text-sm">(Revenue)</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TotalSales;
