import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { fireDB } from "../../firebase.config";
import { useSelector } from "react-redux";
import type { RootState } from "../../Redux/store";
import { Link } from "react-router-dom";

const FooterCart: React.FC = () => {
  const [cartCount, setCartCount] = useState(0);
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (!user?.uid) {
      setCartCount(0);
      return;
    }

    const q = query(collection(fireDB, "cart"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        total += data.quantity || 0;
      });
      setCartCount(total);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  if (!user?.uid || cartCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-purple-600/80 backdrop-blur-sm shadow-lg p-4 flex justify-between items-center z-50">
      <div className="text-white font-bold">
        {cartCount} item{cartCount > 1 ? "s" : ""} in Cart
      </div>
      <Link
        to="/cart"
        className="bg-white/90 text-purple-700 font-bold px-4 py-2 rounded-lg hover:bg-white"
      >
        Go to Cart
      </Link>
    </div>
  );
};

export default FooterCart;
