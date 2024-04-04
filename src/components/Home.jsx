import React from "react";
import { useAuth } from "./AuthContext";
import { Link } from "react-router-dom";
import profilepic from "../img/profile.png";
import "../../src/styles/home.css";

const HomePage = () => {
  const { userLoggedIn } = useAuth();
  return (
    <div className="row justify-content-center">
      <div className="col-lg-8 col-md-12">
       <div className="card-body">
            <>
            
              {userLoggedIn ? (
                <Link to={"/profile"}><h4 className="profiletext"> Profile </h4></Link>
              ) : (
                <h3 className="loginfirsttext">Login first bro</h3>
              )}
            </>
            <img className="cardpfl" src={profilepic} id="profilelogin"></img>
       </div>
     </div>
    </div>
    
  );
};

export default HomePage;
