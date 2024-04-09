import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { doSignOut } from "../config/auth";
import "../../src/styles/header.css";
import logofinai from "../../src/img/finAI.jpg";

const Header = () => {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth();

  return (
    <nav className="nav">
      <Link to={"/"} className="logo-link">
        <img src={logofinai} alt="Logo" className="logo-img" />
      </Link>
      {userLoggedIn ? (
        <Link
          to={"/logout"}
          className="link"
          onClick={() => {
            doSignOut().then(() => {
              navigate("/login");
            });
          }}
        >
          Logout
        </Link>
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
