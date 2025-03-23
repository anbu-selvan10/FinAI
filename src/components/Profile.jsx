import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./contexts/AuthContext";
import "../styles/profile.css";
import { useNavigate } from "react-router-dom";
import profile from "../img/profileimg.jpg";

const Form = () => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    userName: "",
    name: "",
    age: "",
    aboutMe: "",
    phone: "",
    coins: 10,
    email: currentUser ? currentUser.email : null
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [sucMsg, setSucMsg] = useState("");
  const [existingUser, setExistingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("userInfo");
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSucMsg("");
    try {
      const response = await axios.post(
        "http://localhost:4000/api/users",
        formData
      );
      console.log(response.data);
      setSucMsg("Profile Updated!");
    } catch (error) {
      console.error("Error submitting form:", error.response.data.error);
      setErrorMsg(error.response.data.error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-animation"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (existingUser) {
    return (
        <div className="profile-header">
          <div className="profile-image">
            <img src={profile} alt="Profile" />
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{existingUser.name}</h2>
            <p className="profile-title">{existingUser.userName}</p>
            <p className="profile-location"><b>About me:</b> {existingUser.aboutMe}</p>
            <p className="profile-location"><b>Phone number:</b> {existingUser.phone}</p>
            <p className="profile-location"><b>Age:</b>{existingUser.age}</p>
            <div className="profile-actions">
              <button className="follow-button">Add social media</button>
            </div>
          </div>
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-value">{existingUser.coins || 0}</div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="profile-container">
    <div className="edit-profile-container">
      <h2 className="edit-profile-title">Edit Profile</h2>
      
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'userInfo' ? 'active' : ''}`}
          onClick={() => setActiveTab('userInfo')}
        >
          User Info
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="userName">Username</label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              placeholder="Choose a username"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter your age"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••••••"
              readOnly
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              readOnly
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmEmail">Confirm Email Address</label>
            <input
              type="email"
              id="confirmEmail"
              name="confirmEmail"
              value={formData.email}
              readOnly
              placeholder="Confirm your email"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="aboutMe">About Me:</label>
            <textarea
              id="userName"
              name="aboutMe"
              value={formData.aboutMe}
              onChange={handleChange}
              placeholder="Tell us about yourself"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>
        </div>
        
        <button className="update-button" type="submit">Update Info</button>
        
        {errorMsg && <p className="error-message">{errorMsg}</p>}
        {sucMsg && <p className="success-message">{sucMsg}</p>}
      </form>
    </div>
    </div>
  );
};

export default Form;