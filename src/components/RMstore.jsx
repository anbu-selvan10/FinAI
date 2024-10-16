import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

import "../../src/styles/rmstore.css";

import rew1 from "../img/rew1.jpeg";


const RMStore=()=>{
    return(
        <div className="rmstoretitlecont">
            <h1 className="rmstoretitle">Welcome to RM Store</h1>
            <h3 className="rmstoredesc">Claim your rewards here and win exciting prizes !</h3>
        

        <div className="card-container">
            {/* Image */}
            <img
                src={rew1}
                alt="Reward"
                className="card-image"
            />

            <h2 className="card-title">Your Reward</h2>

            <button className="card-button">Spend Coins</button>
            </div>
        </div>

    );

};

export default RMStore;