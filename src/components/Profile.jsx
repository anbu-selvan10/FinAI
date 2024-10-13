import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./contexts/AuthContext";
import "../styles/profile.css";

const Form = () => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    userName: "",
    name: "",
    age: "",
    aboutMe: "",
    phone: "",
    coins:10,
    email: currentUser.email,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [sucMsg, setSucMsg] = useState("");
  const [existingUser, setExistingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:4000/users?email=${currentUser.email}`
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
  }, [currentUser.email]);

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
        "http://localhost:4000/users",
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
    <div className="loading-container">
      <div className="loading-animation"></div>
      <p className="loading-text">Loading...</p>
    </div>;
  }

  if (existingUser) {
    return (
      <div className="formprofile">
        <h2 className="prftext">
          <u>Profile</u>
        </h2>

        <p class="prfelement">User Name: {existingUser.userName}</p>
        <p class="prfelement">Name: {existingUser.name}</p>
        <p class="prfelement">Age: {existingUser.age}</p>
        <p class="prfelement">About Me: {existingUser.aboutMe}</p>
        <p class="prfelement">Phone: {existingUser.phone}</p>
        <p class="prfelement">Email : {existingUser.email}</p>
        <p class="prfelement">RM Coins: {existingUser.coins || 0}</p>
      </div>
    );
  }

  return (
    <div className="formnew">
      <form onSubmit={handleSubmit}>
        <h3 className="formheading">
          <u>Update Profile</u>
        </h3>
        <label>
          <p className="formtextnew">UserName:</p>
          <input
            type="text"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            className="formnewbox"
          />
        </label>
        <br />
        <label>
          <p className="formtextnew">Name:</p>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="formnewbox"
          />
        </label>
        <br />
        <label>
          <p className="formtextnew">Age:</p>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="formnewbox"
          />
        </label>
        <br />
        <label>
          <p className="formtextnew">About Me:</p>
          <textarea
            name="aboutMe"
            value={formData.aboutMe}
            onChange={handleChange}
            className="formnewarea"
          />
        </label>
        <br />
        <label>
          <p className="formtextnew">Phone:</p>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="formnewbox"
          />
        </label>
        <br />
        <label>
          <p className="formtextnew">Email:</p>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="formnewbox"
            readOnly
          />
        </label>
        <label>
          <p className="formtextnew">Reward Coins:</p>
          <input
            type="coins"
            name="coins"
            value={formData.coins}
            onChange={handleChange}
            className="formnewbox"
            readOnly
          />
        </label>
        <br />
        <button onSubmit={handleSubmit} type="submit" className="submitnewform">
          Submit
        </button>
        {errorMsg && <p className="formnewerrortxt">{errorMsg}</p>}
        {sucMsg && (
          <p style={{ color: "green", marginTop: "10%", textAlign: "center" }}>
            {sucMsg}
          </p>
        )}
      </form>
    </div>
  );
};

export default Form;
