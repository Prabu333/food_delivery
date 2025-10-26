import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { fireDB } from "../../../../firebase.config";
import { toast } from "react-toastify";

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

interface Props {
  item: FoodItem;
  onBack: () => void;
}

const ItemDetails: React.FC<Props> = ({ item, onBack }) => {
  const [foodName, setFoodName] = useState(item.foodName);
  const [foodPrice, setFoodPrice] = useState(item.foodPrice);
  const [foodImage, setFoodImage] = useState(item.foodImage);
  const [deliveryTime, setDeliveryTime] = useState(item.deliveryTime);
  const [discountPercentage, setDiscountPercentage] = useState(
    item.discountPercentage || 0
  );
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const imgbbAPIKey = "3a45531be44d6313520995b7d9d54a9f"; // 🔑 Replace with your key

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbAPIKey}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error("Image upload failed");
    }
   
    return data.data.url; // image URL
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);

      let imageUrl = foodImage;
      if (file) {
        imageUrl = await uploadToImgBB(file);
        setFoodImage(imageUrl); // update state with new image
      }

      const docRef = doc(fireDB, "foodItems", item.id);
      await updateDoc(docRef, {
        foodName,
        foodPrice,
        foodImage: imageUrl,
        deliveryTime,
        discountPercentage,
      });

      toast.success("Item updated successfully!");
      onBack(); // go back to list after update
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-md">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold mb-4">Edit Item</h2>

      <div className="flex flex-col gap-4">
        {/* Show current image */}
        <div className="w-full md:w-1/2 h-48 overflow-hidden rounded-lg shadow">
          <img
            src={file ? URL.createObjectURL(file) : foodImage}
            alt={foodName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* File upload */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="p-2 border rounded-md"
        />

        <input
          type="text"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          placeholder="Food Name"
          className="p-2 border rounded-md"
        />

        <input
          type="number"
          value={foodPrice}
          onChange={(e) => setFoodPrice(Number(e.target.value))}
          placeholder="Food Price"
          className="p-2 border rounded-md"
        />

        <input
          type="number"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(Number(e.target.value))}
          placeholder="Delivery Time (mins)"
          className="p-2 border rounded-md"
        />

        <input
          type="number"
          value={discountPercentage}
          onChange={(e) => setDiscountPercentage(Number(e.target.value))}
          placeholder="Discount %"
          className="p-2 border rounded-md"
        />

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? "Updating..." : "Update Item"}
        </button>
      </div>
    </div>
  );
};

export default ItemDetails;
