import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { fireDB } from "../../firebase.config";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";

interface Rating {
  userId: string;
  rating: number;
}

interface FoodItem {
  id: string;
  foodName: string;
  foodImage: string;
  foodPrice: number;
  discountPercentage?: number;
  deliveryTime: string;
  ratings?: Rating[];
}

const ItemWithRating: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);

  const auth = getAuth();

  const navigate = useNavigate();

  // Fetch item from Firestore
  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const docRef = doc(fireDB, "foodItems", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() } as FoodItem);
        }
      } catch (error) {
        console.error("Error fetching item:", error);
        
        toast.error("Failed to fetch item details");
        
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!item) return <p className="text-center mt-10">Item not found</p>;

  // Price Calculation
  const discountedPrice = item.discountPercentage
    ? item.foodPrice - (item.foodPrice * item.discountPercentage) / 100
    : item.foodPrice;

  // Rating Calculation
  const totalPersonRated = item.ratings?.length || 0;
  const totalRatings = item.ratings?.reduce((sum, r) => sum + r.rating, 0) || 0;
  const avgRating =
    totalPersonRated > 0 ? (totalRatings / totalPersonRated).toFixed(1) : "0";

  const user = auth.currentUser;
  const userRating = item.ratings?.find((r) => r.userId === user?.uid)?.rating || 0;

  // Handle Add/Update Rating
  const handleAddRating = async (rating: number) => {
    if (!user) {
      toast.error("You must be logged in to rate");
      navigate("/login");
      return;
    }

    try {
      const docRef = doc(fireDB, "foodItems", item.id);
      const updatedRatings = [...(item.ratings || [])];
      const existingIndex = updatedRatings.findIndex((r) => r.userId === user.uid);

      if (existingIndex !== -1) {
        // Update existing rating
        updatedRatings[existingIndex].rating = rating;
      } else {
        // Add new rating
        updatedRatings.push({ userId: user.uid, rating });
      }

      await updateDoc(docRef, { ratings: updatedRatings });

      // Update UI instantly
      setItem((prev) =>
        prev ? { ...prev, ratings: updatedRatings } : prev
      );

      toast.success("Your rating has been saved!");
      setNewRating(rating);
      setHoverRating(0);
    } catch (error) {
      console.error("Error saving rating:", error);
      toast.error("Failed to save rating");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-lg">
      {/* Image */}
      <img
        src={item.foodImage}
        alt={item.foodName}
        className="w-full h-64 object-cover rounded-lg"
      />

      {/* Food Details */}
      <h1 className="text-2xl font-bold mt-4">{item.foodName}</h1>

      {/* Price Section */}
      <div className="flex items-center gap-2 mt-2">
        {item.discountPercentage ? (
          <>
            <p className="text-gray-500 line-through">₹{item.foodPrice.toFixed(2)}</p>
            <p className="text-green-600 font-bold">
              ₹{discountedPrice.toFixed(2)}
            </p>
            <span className="text-red-500 text-sm">
              ({item.discountPercentage}% OFF)
            </span>
          </>
        ) : (
          <p className="text-green-600 font-bold">₹{item.foodPrice.toFixed(2)}</p>
        )}
      </div>

      {/* Delivery Time */}
      <p className="text-gray-600 mt-2">Delivery Time: {item.deliveryTime}</p>

      {/* Ratings */}
      <div className="mt-4">
        <p className="font-semibold">
          ⭐ {avgRating} / 5 ({totalRatings} total ratings from {totalPersonRated} users)
        </p>
      </div>

      {/* Add Rating with Stars */}
      <div className="mt-4 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            size={28}
            className={`cursor-pointer transition ${
              (hoverRating || userRating || newRating) >= star
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
            onClick={() => handleAddRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          />
        ))}
      </div>
    </div>
  );
};

export default ItemWithRating;
