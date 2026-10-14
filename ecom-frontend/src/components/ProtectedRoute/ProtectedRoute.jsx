import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';

const ProtectedRoute = ({ children, roles }) => {
  const { isLoggedIn, user } = useContext(AppContext);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ ...location.state, from: location.pathname }} />;
  }
  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

export default ProtectedRoute;
