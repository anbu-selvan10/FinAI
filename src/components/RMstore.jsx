import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import axios from "axios";
import "../../src/styles/rmstore.css";
import { useNavigate } from "react-router-dom";
import rew1 from "../img/rew1.jpeg";
import rew2 from "../img/rew2.jpg";

const RMStore = () => {
  const { currentUser } = useAuth();

  const [errorMsg, setErrorMsg] = useState("");
  const [existingUser, setExistingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const items = [
    { id: 1, name: "Boat Headphones", price: 1000, img: rew1 },
    { id: 2, name: "Samsung LED", price: 5000, img: rew2 },
  ];

  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:4000/api/users?email=${currentUser.email}`
        );
        if (response.data) {
          setExistingUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setErrorMsg("Error fetching user data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleSubmit = (price) => {
    if (existingUser.coins < price) {
      alert("Insufficient coin balance");
    } else {
      alert("Product will be delivered!");
    }
  };

  return (
    <div className="rmstoretitlecont">
      <h1 className="rmstoretitle">Welcome to RM Store</h1>
      <h3 className="rmstoredesc">
        Claim your rewards here and win exciting prizes!
      </h3>
      <h3 className="avcoins">
        {existingUser ? existingUser.userName : 0}'s coins balance:{" "}
        {existingUser ? existingUser.coins : 0}
      </h3>
  
      <div className="cards-grid">
        {items.map((item, index) => (
          <div className="card-container" key={item.id}>
            <img src={item.img} alt={item.name} className="card-image" />
  
            <h2 className="card-title">{item.name}</h2>
  
            <button
              className="card-button"
              onClick={() => handleSubmit(item.price)}
            >
              Spend {item.price} Coins
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RMStore;
