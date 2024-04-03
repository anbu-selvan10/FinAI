import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const Form = () => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    userName: "",
    name: "",
    age: "",
    aboutMe: "",
    phone: "",
    email: currentUser.email,
  });
  const [errorMsg, setErrorMsg] = useState("");
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
    try {
      const response = await axios.post(
        "http://localhost:4000/users",
        formData
      );
      console.log(response.data);
    } catch (error) {
      console.error("Error submitting form:", error.response.data.error);
      setErrorMsg(error.response.data.error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (existingUser) {
    return (
      <div>
        <h2>Profile</h2>
        <p>User Name: {existingUser.userName}</p>
        <p>Name: {existingUser.name}</p>
        <p>Age: {existingUser.age}</p>
        <p>About Me: {existingUser.aboutMe}</p>
        <p>Phone: {existingUser.phone}</p>
        <p>Email : {existingUser.email}</p>
        <button onClick={() => console.log("Update button clicked")}>
          Update
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        UserName:
        <input
          type="text"
          name="userName"
          value={formData.userName}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Name:
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Age:
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        About Me:
        <textarea
          name="aboutMe"
          value={formData.aboutMe}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Phone:
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Email:
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          readOnly
        />
      </label>
      <br />
      <button onSubmit={handleSubmit} type="submit">
        Submit
      </button>
      {errorMsg && <p>{errorMsg}</p>}
    </form>
  );
};

export default Form;
