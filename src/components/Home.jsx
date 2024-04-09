import React from "react";
import { useAuth } from "./contexts/AuthContext";
import { Link } from "react-router-dom";
import profilepic from "../img/profile.png";
import "../../src/styles/home.css";

const HomePage = () => {
  const { userLoggedIn } = useAuth();
  return (
    <>
      {userLoggedIn ? (
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-12">
            <div className="card-body">
              <Link
                to={"/profile"}
                style={{ textDecoration: "none", color: "black" }}
              >
                <h4 className="profiletext"> Profile </h4>
              </Link>
              <img className="cardpfl" src={profilepic} id="profilelogin"></img>
            </div>
            <div className="card-body">
              <Link
                to={"/expense"}
                style={{ textDecoration: "none", color: "black" }}
              >
                <h4 className="profiletext"> Expense Tracker </h4>
              </Link>
              <img className="cardpfl" src={profilepic} id="profilelogin"></img>
            </div>
          </div>
        </div>
      ) : (
        <h3 className="loginfirsttext">
          Login first to access the homepage content
        </h3>
      )}
    </>
  );
};

export default HomePage;
