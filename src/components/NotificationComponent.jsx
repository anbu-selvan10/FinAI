import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/notifications.css';

const NotificationComponent = ({ userEmail }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [allRead, setAllRead] = useState(false);

  const fetchMissingExpenseDates = async () => {
    try {
      setLoading(true);
      const currentDate = new Date().toISOString().split('T')[0];
      const response = await axios.get('http://localhost:4000/api/notification/missing-expenses', {
        params: {
          email: userEmail,
          currentDate: currentDate
        }
      });
      setNotifications(response.data.missingDates || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const notificationsRead = localStorage.getItem('notificationsRead') === 'true';
    setAllRead(notificationsRead);

    if (userEmail) {
      fetchMissingExpenseDates();
    } else {
      setLoading(false);
    }
  }, [userEmail]);

  const handleMarkAllRead = () => {
    localStorage.setItem('notificationsRead', 'true');
    setAllRead(true);
  };

  const handleResetNotifications = () => {
    localStorage.removeItem('notificationsRead');
    setAllRead(false);
    fetchMissingExpenseDates();
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  if (loading) {
    return <div className="notification-container loading">Loading notifications...</div>;
  }

  if (error) {
    return <div className="notification-container error">{error}</div>;
  }

  return (
    <div className="notification-container">
      <div className="notification-header" onClick={toggleExpand}>
        <h3>Notifications</h3>
        {!allRead && <span className="notification-count">{notifications.length}</span>}
        <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>
      {expanded && (
        <div className="notification-content">
          {allRead || notifications.length === 0 ? (
            <>
              <p className="no-notifications">You're all caught up! No missing expense entries.</p>
              <div className="notification-actions">
                <button className="mark-read-button" onClick={handleResetNotifications}>
                  Check for New Notifications
                </button>
              </div>
            </>
          ) : (
            <>
              <h4 className="notification-subtitle">Missing Expense Entries</h4>
              <div className="notification-list">
                {notifications.map((date, index) => (
                  <div key={index} className="notification-item">
                    <div className="notification-icon">📅</div>
                    <div className="notification-message">
                      You have missed recording expenses on {new Date(date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="notification-actions">
                <button className="mark-read-button" onClick={handleMarkAllRead}>
                  Mark All Read
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationComponent;