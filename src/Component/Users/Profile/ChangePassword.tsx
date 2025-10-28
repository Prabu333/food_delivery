import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { toast } from "react-toastify";

interface ChangePasswordFormInputs {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const changePasswordSchema = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup.string().min(6, "New password must be at least 6 characters").required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords must match")
    .required("Confirm password is required"),
}).required();

const ChangePassword: React.FC = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordFormInputs>({
    resolver: yupResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormInputs) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    try {
      // Reauthenticate with current password
      const credential = EmailAuthProvider.credential(user.email!, data.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, data.newPassword);
      toast.success("Password updated successfully!");
      reset();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to change password: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-2xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-[Poppins] tracking-wide">Change Password</h2>

      <input
        type="password"
        {...register("currentPassword")}
        placeholder="Current Password"
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.currentPassword?.message}</p>

      <input
        type="password"
        {...register("newPassword")}
        placeholder="New Password"
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.newPassword?.message}</p>

      <input
        type="password"
        {...register("confirmPassword")}
        placeholder="Confirm New Password"
        className="w-full border p-2 rounded"
      />
      <p className="text-red-500 text-sm">{errors.confirmPassword?.message}</p>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        Update Password
      </button>
    </form>
  );
};

export default ChangePassword;
