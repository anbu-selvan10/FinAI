import React from "react";
import { useAuth } from "./AuthContext";

const HomePage = () => {
  const { currentUser, userLoggedIn } = useAuth();
  return (
    <>
      {userLoggedIn ? (
        <div>Hello {currentUser.email}</div>
      ) : (
        <h3>Login first bro</h3>
      )}
    </>
  );
};

export default HomePage;
