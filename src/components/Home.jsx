import React from "react";
import { useAuth } from "./AuthContext";
import { Link } from "react-router-dom";

const HomePage = () => {
  const { userLoggedIn } = useAuth();
  return (
    <>
      {userLoggedIn ? (
        <Link to={"/profile"}> Profile </Link>
      ) : (
        <h3>Login first bro</h3>
      )}
    </>
  );
};

export default HomePage;
