import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { doSignOut } from "../config/auth";

const Header = () => {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth();

  return (
    <nav className="nav">
      {userLoggedIn ? (
        <div>
          <button
            onClick={() => {
              doSignOut().then(() => {
                navigate("/login");
              });
            }}
            className="link"
          >
            Logout
          </button>
        </div>
      ) : (
        <>
          <Link className="link" to={"/login"}>
            Login
          </Link>
          <Link className="link" to={"/register"}>
            Register New Account
          </Link>
        </>
      )}
    </nav>
  );
};

export default Header;
