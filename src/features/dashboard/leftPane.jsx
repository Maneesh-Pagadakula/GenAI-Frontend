import React, { useState } from "react";
import searchLogo from "../../assets/images/search-icon.svg";
// import menuIcon from '../../assets/images/menu-icons.svg';
// import '../../styles/leftPane.css'

export default function LeftPane({ isCollapsed, toggleSidebar }) {
  return (
    <div className={`py-3 ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* <div className="sidebar-toggle" onClick={toggleSidebar}>
        <img src={menuIcon} alt="Toggle Menu" />
      </div> */}

      {!isCollapsed && (
        <>
          <div className="pos-rel nav-pad">
            <input
              type="text"
              className="form-control search-box"
              placeholder="Search"
            />
            <span className="search-icon">
              <img src={searchLogo} alt="Search Bar" />
            </span>
          </div>
          <div className="leftnav-scroll">
            <div className="day mt-0 nav-pad">Today</div>
          </div>
          <div className="leftnav-scroll">
            {/* <div className="day mt-0 nav-pad">Today</div> */}
            {/* <ul className="leftnav-list">
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> Landing Page Validation
                </li>
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> Customer Details</li>
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> Profilr Settings</li>
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> Product List</li>
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> invoice Generator</li>
            </ul> */}
            {/* <div className="day nav-pad">Yesterday</div> */}
            {/* <ul className="leftnav-list">
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> Inventory</li>
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> Vehicle Details</li>
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> Build New Car</li>
            </ul> */}
            {/* <div className="day nav-pad">Previous 7 days</div> */}
            {/* <ul className="leftnav-list">
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> Landing Page</li>
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> Login Details</li>
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> Create New Account</li>
                <li><span><img src={orangeCircle} alt="side orange  circle" /> </span> Product Details</li>
            </ul> */}
          </div>
        </>
      )}
    </div>
  );
}
