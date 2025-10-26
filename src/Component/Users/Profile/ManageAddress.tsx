import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { fireDB } from "../../../firebase.config";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";

interface Address {
  id?: string;
  userId: string;
  address: string;
  addressType: "Home" | "Office" | "Other";
  isDefault: boolean;
}

const ManageAddress: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false); // ✅ track unsaved new address

  const auth = getAuth();

  // Fetch user ID
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        fetchAddresses(user.uid);
      } else {
        setUserId(null);
        setAddresses([]);
      }
    });
    return () => unsub();
  }, []);

  // Fetch addresses from Firestore
  const fetchAddresses = async (uid: string) => {
    setLoading(true);
    try {
      const q = query(collection(fireDB, "addresses"), where("userId", "==", uid));
      const snapshot = await getDocs(q);
      const list: Address[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Address),
      }));
      setAddresses(list);
      setHasUnsaved(false); // ✅ reset unsaved flag
    } catch (err) {
      console.error("Error fetching addresses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add new blank address
  const handleAddAddress = () => {
    if (!userId) {
      toast.error("Please login to add address");
      return;
    }
    setAddresses([
      ...addresses,
      { userId, address: "", addressType: "Home", isDefault: false },
    ]);
    setHasUnsaved(true); // ✅ disable Add button until saved
  };

  // Update state values
  const handleChange = (
    index: number,
    field: keyof Address,
    value: string | boolean
  ) => {
    const updated = [...addresses];
    (updated[index] as any)[field] = value;

    if (field === "isDefault" && value === true) {
      updated.forEach((a, i) => {
        if (i !== index) a.isDefault = false;
      });
    }

    setAddresses(updated);
    setHasUnsaved(true); // mark as unsaved whenever a field changes
  };

  // Save / Update addresses in Firestore
  const handleSave = async () => {
    if (!userId) {
      toast.error("Please login to update addresses");
      return;
    }

    try {
      for (const addr of addresses) {
        if (addr.id) {
          await updateDoc(doc(fireDB, "addresses", addr.id), {
            address: addr.address,
            addressType: addr.addressType,
            isDefault: addr.isDefault,
          });
        } else {
          await addDoc(collection(fireDB, "addresses"), {
            userId,
            address: addr.address,
            addressType: addr.addressType,
            isDefault: addr.isDefault,
          });
        }
      }

      toast.success("Addresses updated successfully!");
      fetchAddresses(userId); // refresh and reset hasUnsaved
    } catch (err) {
      console.error("Error saving addresses:", err);
      toast.error("Failed to update addresses");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow space-y-4">
      <h2 className="text-xl font-bold mb-4">Manage Addresses</h2>

      <button
        onClick={handleAddAddress}
        disabled={hasUnsaved} // ✅ disabled if unsaved changes exist
        className={`mb-4 px-4 py-2 rounded text-white ${
          hasUnsaved ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        ➕ Add Address
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : addresses.length === 0 ? (
        <p className="text-gray-500">No addresses found. Add one!</p>
      ) : (
        addresses.map((addr, index) => (
          <div
            key={addr.id || index}
            className="border p-4 rounded-lg shadow-sm space-y-2"
          >
            <textarea
              value={addr.address}
              onChange={(e) => handleChange(index, "address", e.target.value)}
              placeholder="Enter address..."
              className="w-full border p-2 rounded"
            />

            <select
              value={addr.addressType}
              onChange={(e) =>
                handleChange(index, "addressType", e.target.value)
              }
              className="w-full border p-2 rounded"
            >
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="Other">Other</option>
            </select>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={addr.isDefault}
                onChange={() => handleChange(index, "isDefault", true)}
              />
              Set as Default
            </label>
          </div>
        ))
      )}

      {addresses.length > 0 && (
        <button
          onClick={handleSave}
          className="w-full mt-4 bg-green-500 text-white py-2 rounded hover:bg-green-600"
        >
          ✅ Update Address
        </button>
      )}
    </div>
  );
};

export default ManageAddress;
