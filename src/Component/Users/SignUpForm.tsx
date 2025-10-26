import React, { useState } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { auth, fireDB } from "../../firebase.config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc,addDoc,collection } from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Role = "Customer" | "Restaurant Owner" | "Admin";

interface SignupFormInputs {
  firstName: string;
  lastName: string;
  username: string; // email
  password: string;
  role: Role;
  mobile: string;
  address: string; // mandatory
  deliveryFee?: number;
  restaurantName?: string;
  profileImage?: FileList; // NEW: profile image field
  premiumStartDate?: Date | null;
  premiumEndDate?: Date | null;
}

// Yup validation
const signupSchema: yup.ObjectSchema<SignupFormInputs> = yup
  .object({
    firstName: yup.string().required("First name is required"),
    lastName: yup.string().required("Last name is required"),
    username: yup
      .string()
      .email("Invalid email address")
      .required("Email is required"),
    password: yup.string().min(6, "At least 6 characters").required(),
    role: yup
      .mixed<Role>()
      .oneOf(["Customer", "Restaurant Owner", "Admin"])
      .required("Role is required"),
    mobile: yup
      .string()
      .required("Mobile is required")
      .matches(/^\d{10}$/, "Must be 10 digit number"),
    address: yup.string().required("Address is required"),
    deliveryFee: yup.number().when("role", {
      is: "Restaurant Owner",
      then: (schema) =>
        schema
          .typeError("Delivery fee must be a number")
          .required("Delivery fee is required")
          .min(0, "Must be positive"),
      otherwise: (schema) => schema.notRequired(),
    }),
    restaurantName: yup.string().when("role", {
      is: "Restaurant Owner",
      then: (schema) => schema.required("Restaurant name is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    profileImage: yup
  .mixed()
  .test("fileSize", "Image is too large", (value) => {
    const fileList = value as FileList | undefined;
    if (!fileList?.length) return true; // optional
    return fileList[0].size <= 5 * 1024 * 1024; // 5MB
  })
  .test("fileType", "Unsupported file format", (value) => {
    const fileList = value as FileList | undefined;
    if (!fileList?.length) return true;
    return ["image/jpeg", "image/png", "image/jpg"].includes(fileList[0].type);
  }),

  })
  .required() as yup.ObjectSchema<SignupFormInputs>;

// Convert file to Base64 for ImgBB
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]); // remove prefix
    reader.onerror = (error) => reject(error);
  });

const SignupForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormInputs>({
    resolver: yupResolver(signupSchema),
  });

  const navigate = useNavigate();
  const selectedRole = watch("role");
  const [uploading, setUploading] = useState(false);

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    try {
      setUploading(true);
      let profileURL = "";

      // ✅ Upload profile image to ImgBB if selected
      if (data.profileImage && data.profileImage.length > 0) {
        const file = data.profileImage[0];
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

        profileURL = result.data.url;
      }

      // ✅ Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.username,
        data.password
      );
      const user = userCredential.user;

      // ✅ Save user in Firestore
      await setDoc(doc(fireDB, "users", user.uid), {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.username,
        role: data.role,
        mobile: data.mobile,
        address: data.address,
        deliveryFee: data.role === "Restaurant Owner" ? data.deliveryFee : null,
        restaurantName: data.role === "Restaurant Owner" ? data.restaurantName : null,
        profileImage: profileURL || null, // store ImgBB URL
        premiumStartDate: null,
        premiumEndDate: null,
        createdAt: new Date(),
        uid: user.uid,
      });

      //save address
      await addDoc(collection(fireDB, "addresses"), {
  userId: user.uid,
  address: data.address,      // "2/63, west street, sakkamalpuram, sawyerpuram"
  addressType: "Home",        // note the field name `addressType` instead of `type`
  isDefault: true,
  createdAt: new Date(),
});

      toast.success("Signup successful!");
      navigate("/login");
    } catch (error: any) {
      console.error("Error signing up:", error.message);
      toast.error("Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md space-y-4"
    >
      <h2 className="text-xl font-bold text-center">Signup</h2>

      <input
        {...register("firstName")}
        placeholder="First Name"
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.firstName?.message}</p>

      <input
        {...register("lastName")}
        placeholder="Last Name"
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.lastName?.message}</p>

      <input
        type="email"
        {...register("username")}
        placeholder="Email Address"
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.username?.message}</p>

      <input
        type="password"
        {...register("password")}
        placeholder="Password"
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.password?.message}</p>

      <select {...register("role")} className="w-full border p-2 rounded">
        <option value="">Select Role</option>
        <option value="Customer">Customer</option>
        <option value="Restaurant Owner">Restaurant Owner</option>
        <option value="Admin">Admin</option>
      </select>
      <p className="text-red-500 text-sm">{errors.role?.message}</p>

      <input
        {...register("mobile")}
        placeholder="Mobile"
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.mobile?.message}</p>

      <textarea
        {...register("address")}
        placeholder="Full Address"
        className="w-full border p-2 rounded"
        rows={3}
      />
      <p className="text-red-500 text-sm">{errors.address?.message}</p>

      {/* Profile Image Field */}
      <input
        type="file"
        {...register("profileImage")}
        accept="image/*"
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.profileImage?.message}</p>

      {selectedRole === "Restaurant Owner" && (
        <>
          <input
            {...register("restaurantName")}
            placeholder="Restaurant Name"
            className="w-full border p-2 rounded"
          />
          <p className="text-red-500 text-sm">{errors.restaurantName?.message}</p>

          <input
            type="number"
            {...register("deliveryFee")}
            placeholder="Delivery Fee"
            className="w-full border p-2 rounded"
            min={0}
            step="0.01"
          />
          <p className="text-red-500 text-sm">{errors.deliveryFee?.message}</p>
        </>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        {uploading ? "Signing up..." : "Signup"}
      </button>

      <p className="text-center mt-4 text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Go to Login
        </Link>
      </p>
    </form>
  );
};

export default SignupForm;
