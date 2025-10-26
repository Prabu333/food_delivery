import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./Component/Header/Header";
import HomePage from "./Component/Homepage/Homepage";
import LoginForm from "./Component/Users/LoginForm";
import SignupForm from "./Component/Users/SignUpForm";
import ProfileLayout from "./Component/Users/Profile/Profile";
import CartItems from "./Component/CartItems/CartItems";
import Shop from "./Component/ShopComponent/ShopComponent";
import ItemWithRating from "./Component/ShopComponent/ItemWithRating";
import ProtectedRoute from "./Component/CartItems/ProtectedRoute"; // ✅
import Checkout from "./Component/CartItems/Checkout";

const App: React.FC = () => {
  const [searchResult, setSearchResult] = useState<string>('')
  return (
    <Router>
      <Header searchResult ={searchResult} setSearchResult = {setSearchResult}/>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<HomePage  searchResult ={searchResult}/>} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartItems />
              </ProtectedRoute>
            }
          />
          <Route path="/shop" element={<Shop searchResult ={searchResult}/>} />
          <Route path="/item/:id" element={<ItemWithRating />} />

          <Route
            path="/profile/*"
            element={
              <ProtectedRoute>
                <ProfileLayout />
              </ProtectedRoute>
            }
          />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
