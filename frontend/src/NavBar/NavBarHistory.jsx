import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LuCircleFadingPlus } from "react-icons/lu";
import { MdLogout } from "react-icons/md";
import { GiHamburgerMenu } from "react-icons/gi";
import './NavBarHistory.css'

function NavbarHistory({ user ,onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar-history">
      <span className="nav-logo">✨ Briefly</span>
      <h3>{user}'s SUMMARIES</h3>
      {/* Hamburger menu for small screens */}
      <div className="hamburger" onClick={toggleMenu}>
        <GiHamburgerMenu size={24} />
      </div>

      {/* Links */}
      <div className={`nav-links ${isOpen ? "open" : ""}`}>
        
        <Link to="/home" className="nav-item" title="Create a new summary">
          <LuCircleFadingPlus /> New Summary
        </Link>
        <button className="logout" onClick={onLogout}>
          <MdLogout size={18} /> Log Out
        </button>
      </div>
    </nav>
  );
}

export default NavbarHistory;
