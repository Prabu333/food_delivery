import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { fireDB } from "../../../../firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { toast } from "react-toastify";

type Role = "Customer" | "Restaurant Owner" | "Admin";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword: string;
  role: Role;
  mobile: string;
  deliveryFee?: number | null;
  restaurantName?: string | null;
  profileImage?: FileList; // new file upload input
  profileImageUrl?: string | null; // ImgBB or Firestore URL
}

// ✅ Validation Schema
const profileSchema: yup.ObjectSchema<UserProfile> = yup
  .object({
    firstName: yup.string().required("First name is required"),
    lastName: yup.string().required("Last name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    currentPassword: yup.string().required("Current password is required"),
    role: yup
      .mixed<Role>()
      .oneOf(["Customer", "Restaurant Owner", "Admin"])
      .required(),
    mobile: yup
      .string()
      .matches(/^\d{10}$/, "Must be 10 digits")
      .required(),
    deliveryFee: yup
      .number()
      .nullable()
      .when("role", {
        is: "Restaurant Owner",
        then: (schema) =>
          schema
            .typeError("Delivery fee must be a number")
            .min(0, "Must be positive"),
        otherwise: (schema) => schema.notRequired(),
      }),
    restaurantName: yup.string().nullable(),
    profileImage: yup
      .mixed()
      .test("fileSize", "Image too large (max 5MB)", (value) => {
        const fileList = value as FileList | undefined;
        if (!fileList?.length) return true;
        return fileList[0].size <= 5 * 1024 * 1024;
      })
      .test("fileType", "Unsupported file format", (value) => {
        const fileList = value as FileList | undefined;
        if (!fileList?.length) return true;
        return ["image/jpeg", "image/png", "image/jpg"].includes(
          fileList[0].type
        );
      }),
  })
  .required() as yup.ObjectSchema<UserProfile>;

// ✅ Convert File to Base64 (for ImgBB)
const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      resolve((reader.result as string).split(",")[1]); // remove metadata
    reader.onerror = (error) => reject(error);
  });

const ProfileDetails: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<UserProfile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const authInstance = getAuth();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserProfile>({
    resolver: yupResolver(profileSchema),
    defaultValues: initialData || {},
  });

  const selectedRole = watch("role");

  // ✅ Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const user = authInstance.currentUser;
      if (!user) {
        toast.error("You must be logged in");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(fireDB, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;

          const userData: UserProfile = {
            ...data,
            profileImageUrl: (data.profileImage as unknown as string) || null,
            profileImage: undefined,
            currentPassword: "",
          };

          reset(userData);
          setInitialData(userData);
          setPreviewUrl(userData.profileImageUrl || null);
        } else {
          toast.error("User data not found");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authInstance, reset]);

  // ✅ Handle Form Submit
  const onSubmit: SubmitHandler<UserProfile> = async (data) => {
    const user = authInstance.currentUser;
    if (!user) return;

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email!,
        data.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      let profileUrl = data.profileImageUrl || "";

      // ✅ If new image selected → upload to ImgBB
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
          toast.error("Image upload failed");
          return;
        }

        profileUrl = result.data.url;
      }

      // ✅ Update Firestore
      const docRef = doc(fireDB, "users", user.uid);
      await updateDoc(docRef, {
        firstName: data.firstName,
        lastName: data.lastName,
        mobile: data.mobile,
        deliveryFee: data.deliveryFee ?? null,
        profileImage: profileUrl, // stored in Firestore
      });

      toast.success("Profile updated successfully!");

      const updatedData: UserProfile = {
        ...data,
        currentPassword: "",
        profileImageUrl: profileUrl,
        profileImage: undefined,
      };

      reset(updatedData);
      setPreviewUrl(profileUrl);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update profile: " + err.message);
    }
  };

  // ✅ Handle Image Preview Before Upload
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  if (loading) return <p className="text-center mt-6">Loading...</p>;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md space-y-4"
    >
      <h2 className="text-2xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-[Poppins] tracking-wide">
  Profile Details
</h2>


      {/* ✅ Profile Image Preview */}
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Profile"
          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border"
        />
      ) : (
        <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center text-gray-500">
          No Image
        </div>
      )}

      {/* ✅ Upload new image */}
      <input
        type="file"
        {...register("profileImage")}
        accept="image/*"
        onChange={handleImageChange}
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.profileImage?.message}</p>

      {/* ✅ Other fields */}
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
        {...register("email")}
        placeholder="Email"
        disabled
        className="w-full border p-2 rounded bg-gray-100"
      />
      <p className="text-red-500 text-sm">{errors.email?.message}</p>

      <input
        type="password"
        {...register("currentPassword")}
        placeholder="Current Password"
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.currentPassword?.message}</p>

      <select
        {...register("role")}
        disabled
        className="w-full border p-2 rounded bg-gray-100"
      >
        <option value="">Select Role</option>
        <option value="Customer">Customer</option>
        <option value="Restaurant Owner">Restaurant Owner</option>
        <option value="Admin">Admin</option>
      </select>

      {selectedRole === "Restaurant Owner" && (
        <>
          <input
            {...register("restaurantName")}
            placeholder="Restaurant Name"
            disabled
            className="w-full border p-2 rounded bg-gray-100"
          />
          <input
            type="number"
            {...register("deliveryFee")}
            placeholder="Delivery Fee"
            className="w-full border p-2 rounded"
          />
          <p className="text-red-500 text-sm">{errors.deliveryFee?.message}</p>
        </>
      )}

      <input
        {...register("mobile")}
        placeholder="Mobile"
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.mobile?.message}</p>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        Update Profile
      </button>
    </form>
  );
};

export default ProfileDetails;
