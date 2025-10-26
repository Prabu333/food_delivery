import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingCartIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../Redux/store";
import { clearUser } from "../../Redux/UserSlice";
import { auth, fireDB } from "../../firebase.config";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

interface HeaderPageProps {
  searchResult: string;
  setSearchResult: React.Dispatch<React.SetStateAction<string>>;
}

const Header: React.FC<HeaderPageProps> = ({ searchResult, setSearchResult }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userMenuRef = useRef<HTMLDivElement>(null);

  // ✅ Fetch user profile image from Firestore if logged in
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (user?.uid) {
        try {
          const docRef = doc(fireDB, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileImage(data?.profileImage || null);
          } else {
            setProfileImage(null);
          }
        } catch (err) {
          console.error("Failed to fetch profile image:", err);
        }
      } else {
        setProfileImage(null);
      }
    };

    fetchProfileImage();
  }, [user?.uid]);

  // ✅ Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(clearUser());
      toast.success("Logout Successful");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
  <header className="sticky top-0 z-50 w-full px-6 py-3 shadow-md bg-gradient-to-r from-[#f0f4f8] via-[#e2ebf5] to-[#d9e6f2]">
      <div className="flex items-center justify-between relative">
        {/* Left - Logo */}
        <div className="flex items-center">
          <img
            src="https://i.ibb.co/Tx48LBdk/c5828aa3-ad65-4c0a-8bb0-12aeb0ec7790.png"
            alt="company logo"
            className="w-32 h-12 object-contain"
          />
        </div>

        {/* Center - Search */}
        <div className="flex-1 mx-4">
          <div className="flex items-center w-full border border-gray-300 rounded-lg px-3 py-1">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchResult}
              onChange={(e) => setSearchResult(e.target.value)}
              className="ml-2 flex-grow outline-none text-sm bg-transparent"
            />
          </div>
        </div>

        {/* Right - Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-6 text-gray-700 font-medium relative">
          <Link to="/" className="hover:text-blue-600">
            Home
          </Link>
          <Link to="/shop" className="hover:text-blue-600">
            Shop
          </Link>
          <Link to="/cart" className="hover:text-blue-600 flex items-center">
            <ShoppingCartIcon className="h-5 w-5 mr-1" /> Cart
          </Link>

          {/* ✅ User Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setUserMenuOpen((prev) => !prev)} className="focus:outline-none">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="User"
                  className="h-8 w-8 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-gray-700 cursor-pointer hover:text-blue-600" />
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg z-20">
                {user?.uid ? (
                  <>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Signup
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? (
              <XMarkIcon className="h-6 w-6 text-gray-700" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-3 space-y-1 text-gray-700 font-medium">
          <Link to="/" className="block px-2 py-2 hover:text-blue-600">
            Home
          </Link>
          <Link to="/shop" className="block px-2 py-2 hover:text-blue-600">
            Shop
          </Link>
          <Link to="/cart" className="px-2 py-2 hover:text-blue-600 flex items-center">
            <ShoppingCartIcon className="h-5 w-5 mr-1" /> Cart
          </Link>

          {user?.uid ? (
            <>
              <Link
                to="/profile"
                className="px-2 py-2 hover:text-blue-600 flex items-center"
              >
                 {profileImage ? (
                <img
                  src={profileImage}
                  alt="User"
                  className="h-8 w-8 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-gray-700 cursor-pointer hover:text-blue-600" />
              )} Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-2 py-2 hover:text-blue-600 flex items-center"
              >
                {profileImage ? (
                <img
                  src={profileImage}
                  alt="User"
                  className="h-8 w-8 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-gray-700 cursor-pointer hover:text-blue-600" />
              )}Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-2 py-2 hover:text-blue-600 flex items-center"
              >
                <UserCircleIcon className="h-6 w-6 mr-1 text-gray-700" /> Login
              </Link>
              <Link
                to="/signup"
                className="px-2 py-2 hover:text-blue-600 flex items-center"
              >
                <UserCircleIcon className="h-6 w-6 mr-1 text-gray-700" /> Signup
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
