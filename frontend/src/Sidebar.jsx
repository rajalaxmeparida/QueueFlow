import "./Sidebar.css";

function Sidebar({ activePage, setActivePage, onLogout, manager }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "queues", label: "My Queues", icon: "▤" },
    { id: "analytics", label: "Analytics", icon: "▥" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">Q</div>
        <span>QueueFlow</span>
      </div>

      <div className="sidebar-section-label">WORKSPACE</div>

      <nav className="sidebar-navigation">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-link ${activePage === item.id ? "active" : ""}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-manager">
          <div className="manager-avatar">
            {(manager?.name || "M").charAt(0).toUpperCase()}
          </div>
          <div className="manager-info">
            <strong>{manager?.name || "Manager"}</strong>
            <span>Administrator</span>
          </div>
        </div>

        <button type="button" className="sidebar-logout" onClick={onLogout}>
          ↪ <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
