import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { fireDB } from "../../../../firebase.config"; // adjust path
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../Redux/store"; // adjust path

// -------------------- Types --------------------
interface FoodItemForm {
  foodName: string;
  foodGroup: string;
  foodHotel: string;
  foodPrice: number;
  foodImage: FileList;
  deliveryTime: number;
  foodType: "Veg" | "Non Veg";
  discountPercentage?: number | null;
}

// -------------------- Validation Schema --------------------
const schema: yup.ObjectSchema<FoodItemForm> = yup.object({
  foodName: yup.string().required("Food name is required"),
  foodGroup: yup.string().required("Food group is required"),
  foodHotel: yup.string().required("Restaurant name is required"),
  foodPrice: yup
    .number()
    .typeError("Must be a number")
    .positive("Food price must be positive")
    .required("Food price is required"),
  foodImage: yup
    .mixed<FileList>()
    .test("required", "Food image is required", (value): value is FileList => {
      return value instanceof FileList && value.length > 0;
    })
    .required("Food image is required"),
  deliveryTime: yup
    .number()
    .typeError("Must be a number")
    .positive("Delivery time must be positive")
    .required("Delivery time is required"),
  foodType: yup.mixed<"Veg" | "Non Veg">().oneOf(["Veg", "Non Veg"]).required(),
  discountPercentage: yup
    .number()
    .nullable()
    .transform((_, val) => (val !== "" ? Number(val) : null))
    .max(100, "Discount Percentage cannot be greater than 100"),
});

// -------------------- Helper: Convert File to Base64 --------------------
const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip "data:image/*;base64,"
    };
    reader.onerror = (error) => reject(error);
  });
};

// -------------------- Component --------------------
const AddItem: React.FC = () => {
  const auth = getAuth();

  // ✅ Get restaurant name from Redux user state
  const restaurantName = useSelector(
    (state: RootState) => state.user.restaurantName
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FoodItemForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      foodName: "",
      foodGroup: "",
      foodHotel: restaurantName || "", // auto bind restaurant name
      foodPrice: 0,
      foodImage: undefined as unknown as FileList,
      deliveryTime: 0,
      foodType: "Veg",
      discountPercentage: null,
    },
  });

  const onSubmit = async (data: FoodItemForm) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to add food items.");
        return;
      }

      // ✅ Step 1: Check if item already exists
      const q = query(
        collection(fireDB, "foodItems"),
        where("userId", "==", user.uid),
        where("foodHotel", "==", data.foodHotel),
        where("foodName", "==", data.foodName)
      );

      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        toast.error("This item already exists for this restaurant.");
        return;
      }

      // ✅ Step 2: Upload image to ImgBB
      const file = data.foodImage[0];
      const base64Image = await toBase64(file);

      const formData = new FormData();
      formData.append("key", "3a45531be44d6313520995b7d9d54a9f"); // replace with your ImgBB key
      formData.append("image", base64Image);

      const res = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!result.success) {
        console.error("ImgBB upload failed:", result);
        toast.error("Image upload failed.");
        return;
      }

      const imageUrl = result.data.url;

      // ✅ Step 3: Save to Firestore
      await addDoc(collection(fireDB, "foodItems"), {
        ...data,
        foodImage: imageUrl,
        foodHotel: restaurantName, // enforce correct name
        userId: user.uid,
        createdAt: Timestamp.now(),
        totalRatings: 0,
        totalPersonRated: 0,
      });

      reset();
      toast.success("Food item added successfully!");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item.");
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto my-4">
      <h2 className="text-2xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-[Poppins] tracking-wide mb-2">
        Add Food Item
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Food Name */}
        <div>
          <label className="block mb-1 font-medium">Food Name *</label>
          <input
            type="text"
            {...register("foodName")}
            className="w-full p-2 border rounded"
          />
          {errors.foodName && (
            <p className="text-red-500 text-sm">{errors.foodName.message}</p>
          )}
        </div>

        {/* Food Group */}
        <div>
          <label className="block mb-1 font-medium">Food Group *</label>
          <select {...register("foodGroup")} className="w-full p-2 border rounded">
            <option value="">Select Food Group</option>
            <option value="Meals">Meals</option>
            <option value="Chicken">Chicken</option>
            <option value="Mutton">Mutton</option>
            <option value="Fish">Fish</option>
            <option value="Cake">Cake</option>
            <option value="Snacks">Snacks</option>
            <option value="Cooldrinks">Cooldrinks</option>
            <option value="Tiffin">Tiffin</option>
          </select>
          {errors.foodGroup && (
            <p className="text-red-500 text-sm">{errors.foodGroup.message}</p>
          )}
        </div>

        {/* Restaurant Name (auto from user, disabled) */}
        <div>
          <label className="block mb-1 font-medium">Restaurant Name *</label>
          <input
            type="text"
            {...register("foodHotel")}
            value={restaurantName || ""}
            disabled
            className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
          />
          {errors.foodHotel && (
            <p className="text-red-500 text-sm">{errors.foodHotel.message}</p>
          )}
        </div>

        {/* Food Price */}
        <div>
          <label className="block mb-1 font-medium">Food Price *</label>
          <input
            type="number"
            {...register("foodPrice")}
            className="w-full p-2 border rounded"
          />
          {errors.foodPrice && (
            <p className="text-red-500 text-sm">{errors.foodPrice.message}</p>
          )}
        </div>

        {/* Food Image */}
        <div>
          <label className="block mb-1 font-medium">Upload Food Image *</label>
          <input
            type="file"
            accept="image/*"
            {...register("foodImage")}
            className="w-full p-2 border rounded"
          />
          {errors.foodImage && (
            <p className="text-red-500 text-sm">{errors.foodImage.message}</p>
          )}
        </div>

        {/* Delivery Time */}
        <div>
          <label className="block mb-1 font-medium">Delivery Time (minutes) *</label>
          <input
            type="number"
            {...register("deliveryTime")}
            className="w-full p-2 border rounded"
          />
          {errors.deliveryTime && (
            <p className="text-red-500 text-sm">{errors.deliveryTime.message}</p>
          )}
        </div>

        {/* Food Type */}
        <div>
          <label className="block mb-1 font-medium">Food Type *</label>
          <select {...register("foodType")} className="w-full p-2 border rounded">
            <option value="">Select Food Type</option>
            <option value="Veg">Veg</option>
            <option value="Non Veg">Non Veg</option>
          </select>
          {errors.foodType && (
            <p className="text-red-500 text-sm">{errors.foodType.message}</p>
          )}
        </div>

        {/* Discount Percentage */}
        <div>
          <label className="block mb-1 font-medium">Discount Percentage</label>
          <input
            type="number"
            {...register("discountPercentage")}
            className="w-full p-2 border rounded"
          />
          {errors.discountPercentage && (
            <p className="text-red-500 text-sm">
              {errors.discountPercentage.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>

        {isSubmitSuccessful && (
          <p className="text-green-600 text-sm mt-2 text-center">
            Item saved successfully!
          </p>
        )}
      </form>
    </div>
  );
};

export default AddItem;
