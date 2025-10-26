import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { fireDB } from "../../../../firebase.config";
import { toast } from "react-toastify";
import ItemDetails from "./ItemDetails"; // import details component

interface FoodItem {
  id: string;
  foodName: string;
  foodPrice: number;
  foodImage: string;
  deliveryTime: number;
  foodHotel: string;
  foodType: "Veg" | "Non Veg";
  foodGroup: string;
  discountPercentage?: number | null;
}

const ViewItems: React.FC = () => {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);

  const auth = getAuth();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to view your items.");
      setLoading(false);
      return;
    }

    const q = query(
      collection(fireDB, "foodItems"),
      where("userId", "==", user.uid)
    );

    // 🔥 Real-time snapshot listener
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const userItems: FoodItem[] = snap.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as FoodItem)
        );
        setItems(userItems);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching items:", error);
        toast.error("Failed to fetch items.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const filteredItems = items.filter((item) => {
    const groupMatch =
      selectedGroup === "All" || item.foodGroup === selectedGroup;
    const typeMatch = selectedType === "All" || item.foodType === selectedType;
    return groupMatch && typeMatch;
  });

  if (loading) {
    return <p className="text-center mt-6">Loading items...</p>;
  }

  if (!selectedItem && items.length === 0) {
    return (
      <p className="text-center mt-6 text-gray-600">
        No food items found. Add some first!
      </p>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-md max-w-7xl mx-auto my-4">
      {!selectedItem ? (
        <>
          <h2 className="text-2xl font-bold mb-6 text-center md:text-left">
            My Food Items
          </h2>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="p-2 border rounded-md shadow-sm"
            >
              <option value="All">All Groups</option>
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
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="p-2 border rounded-md shadow-sm"
            >
              <option value="All">All Types</option>
              <option value="Veg">Veg</option>
              <option value="Non Veg">Non Veg</option>
            </select>
          </div>

          {/* Responsive Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="cursor-pointer border rounded-lg shadow hover:shadow-lg transition flex flex-col bg-gray-50 overflow-hidden"
              >
                {/* Food Image */}
                <div className="w-full h-40 sm:h-48 md:h-52 overflow-hidden">
                  <img
                    src={item.foodImage}
                    alt={item.foodName}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>

                {/* Food Details */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold mb-2 break-words">
                    {item.foodName}
                  </h3>
                  <p className="text-gray-700 font-medium">
                    Price: ₹{item.foodPrice}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Delivery: {item.deliveryTime} min
                  </p>
                  <p className="text-gray-500 text-sm italic">
                    Group: {item.foodGroup}
                  </p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 text-xs rounded-full w-max ${
                      item.foodType === "Veg"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.foodType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <ItemDetails item={selectedItem} onBack={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default ViewItems;
