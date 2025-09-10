import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LuCircleFadingPlus } from "react-icons/lu";
import { FaHistory } from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import { GiHamburgerMenu } from "react-icons/gi";
import "./NavBar.css";

function Navbar({ onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <span className="nav-logo">✨ Briefly</span>

      <div className="hamburger" onClick={toggleMenu}>
        <GiHamburgerMenu size={24} />
      </div>

      <div className={`nav-links ${isOpen ? "open" : ""}`}>
        <Link to="/home" className="nav-item">
          <LuCircleFadingPlus /> New Summary
        </Link>
        <Link to="/history" className="nav-item">
          <FaHistory /> History
        </Link>
        <button className="logout" onClick={onLogout}>
          <MdLogout size={18} /> Log Out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
