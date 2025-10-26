import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../Redux/store";
import { Link, useNavigate, Routes, Route, useLocation } from "react-router-dom";
import AddItem from "./RestaurantOwner/AddItem";
import ViewItems from "./RestaurantOwner/ViewItem";
import ProfileDetails from "./RestaurantOwner/ProfileDetails";
import ChangePassword from "./ChangePassword";
import ManageAddress from "./ManageAddress";
import CartItems from "../../CartItems/CartItems";
import BuyPremium from "./Customer/BuyPremium";
import TotalOrders from "./TotalOrders";
import TotalSales from "./RestaurantOwner/TotalSales";
// import AddItem from "./RestaurantOwner/AddItem";

// Dummy components
const TotalUsers = () => <div>Total Users Content</div>;
const PremiumMembers = () => <div>Premium Members Content</div>;
const Notifications = () => <div>Notifications Content</div>;

interface MenuItem {
  label: string;
  path: string;
  component: React.ReactNode;
}

const ProfileLayout: React.FC = () => {
  const user = useSelector((state: RootState) => state.user);
  const [isMobile, setIsMobile] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!user.uid) {
    return (
      <div className={`p-4 ${isMobile ? "border-t" : ""}`}>
        <p className="text-gray-600">You are not logged in</p>
        <Link
          to="/login"
          className="block mt-2 text-blue-500 hover:underline text-sm"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const menuItems: MenuItem[] = (() => {
    switch (user.role) {
      case "Customer":
        return [
          { label: "Total Orders", path: "orders", component: <TotalOrders /> },
          { label: "Cart", path: "cart", component: <CartItems /> },
          { label: "Profile Details", path: "profile", component: <ProfileDetails /> },
          { label: "Manage Addresses", path: "address", component: <ManageAddress /> },
          { label: "Buy Premium", path: "premium", component: <BuyPremium /> },
          { label: "Change Password", path: "password", component: <ChangePassword /> },
        ];
      case "Restaurant Owner":

        return [
          { label: "Add Item", path: "additem", component: <AddItem /> },
          { label: "View Item", path: "viewitem", component: <ViewItems /> },
          { label: "Total Sales", path: "sales", component: <TotalSales /> },
          { label: "Profile Details", path: "profile", component: <ProfileDetails /> },
          { label: "Change Password", path: "password", component: <ChangePassword /> },
          { label: "Manage Address", path: "address", component: <ManageAddress /> },
        ];
      case "Admin":
        return [
          { label: "Total Users", path: "users", component: <TotalUsers /> },
          { label: "Total Sales", path: "admin-sales", component: <TotalSales /> },
          { label: "Premium Members", path: "premium-members", component: <PremiumMembers /> },
          { label: "Notifications", path: "notifications", component: <Notifications /> },
          { label: "Change Password", path: "password", component: <ChangePassword /> },
          { label: "Manage Address", path: "address", component: <ManageAddress /> },
        ];
      default:
        return [];
    }
  })();

  const activeMenu = location.pathname.split("/").pop() || menuItems[0]?.path;

  useEffect(() => {
    if (!location.pathname.split("/").pop() && menuItems.length > 0) {
      navigate(`/profile/${menuItems[0].path}`, { replace: true });
    }
  }, [location.pathname, menuItems, navigate]);

  // ---------- MOBILE (Accordion Style) ----------
  if (isMobile) {
    return (
      <div className="p-4 bg-purple-50 min-h-screen">
        <div className="font-bold text-gray-700 mb-3 text-center text-lg">
          Hi, {user.firstName} {user.lastName} ({user.role})
        </div>
        <div className="divide-y divide-gray-200">
          {menuItems.map((item) => (
            <div key={item.path}>
              <button
                className={`w-full text-left px-4 py-3 text-base rounded-md my-1 transition-colors duration-200
                  ${
                    openItem === item.path
                      ? "bg-purple-200 font-semibold"
                      : "hover:bg-purple-100"
                  }`}
                onClick={() =>
                  setOpenItem(openItem === item.path ? null : item.path)
                }
              >
                {item.label}
              </button>

              {openItem === item.path && (
                <div className="p-3 bg-white border border-gray-200 rounded-md mt-1 mb-2 text-sm shadow">
                  {item.component}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- DESKTOP (Sidebar + Content) ----------
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 p-4 bg-purple-400/60 backdrop-blur-md text-white overflow-y-auto rounded-r-2xl shadow-lg">
        <div className="font-bold mb-4 text-center text-xl">
          Hi, {user.firstName} {user.lastName} ({user.role})
        </div>
        <div className="divide-y divide-purple-300/40">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`w-full text-left px-4 py-3 text-lg rounded-md my-1 transition-colors duration-200
                ${
                  activeMenu === item.path
                    ? "bg-purple-600/70 text-white font-semibold"
                    : "text-white font-medium hover:bg-purple-500/60"
                }`}
              onClick={() => navigate(`/profile/${item.path}`)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full md:w-3/4 p-6 overflow-y-auto bg-white rounded-l-2xl shadow-inner">
        <Routes>
          {menuItems.map((item) => (
            <Route key={item.path} path={item.path} element={item.component} />
          ))}
        </Routes>
      </div>
    </div>
  );
};

export default ProfileLayout;
