import React from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { auth, fireDB } from "../../firebase.config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { setUser } from "../../Redux/UserSlice";
import type { UserState } from "../../Redux/UserSlice"; // type-only import


// ---------------- Types ----------------
interface LoginFormInputs {
  username: string; // email
  password: string;
}

// ---------------- Validation ----------------
const usernameRegex =
  /^(?:\d{10}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})$/;

const loginSchema: yup.ObjectSchema<LoginFormInputs> = yup
  .object({
    username: yup
      .string()
      .required("Username is required")
      .matches(usernameRegex, "Must be valid email or mobile number"),
    password: yup.string().required("Password is required"),
  })
  .required() as yup.ObjectSchema<LoginFormInputs>;

const LoginForm: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(loginSchema),
  });

  // ---------------- Submit Login ----------------
  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.username, data.password);
      const user = userCredential.user;

      // Fetch user details from Firestore
      const userDoc = await getDoc(doc(fireDB, "users", user.uid));
      if (userDoc.exists()) {
         toast.success("Login successful!");
        const userData = userDoc.data() as UserState; // ✅ Cast to UserState
        dispatch(setUser(userData)); // Store in Redux
        navigate("/"); // Navigate to homepage
      } else {
        toast.error("User record not found in database");
      }
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        toast.error("User not found");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address");
      } else {
        toast.error(error.message);
      }
    }
  };

  // ---------------- Forgot Password ----------------
 

  return (
    <div className="max-w-md mx-auto mt-10 p-6 shadow-lg rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username */}
        <div>
          <input
            {...register("username")}
            placeholder="Email or Mobile Number"
            className="w-full border p-2 rounded"
          />
          <p className="text-red-500 text-sm">{errors.username?.message}</p>
        </div>

        {/* Password */}
        <div>
          <input
            type="password"
            {...register("password")}
            placeholder="Password"
            className="w-full border p-2 rounded"
          />
          <p className="text-red-500 text-sm">{errors.password?.message}</p>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>

      <div className="flex justify-between mt-3 text-sm">
      

        <span>
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-blue-600 hover:underline"
          >
            Signup
          </button>
        </span>
      </div>

      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </div>
  );
};

export default LoginForm;


