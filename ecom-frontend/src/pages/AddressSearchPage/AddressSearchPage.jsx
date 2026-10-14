import { Navigate, useLocation } from 'react-router-dom';

export default function AddressSearchPage() {
  const route = useLocation();
  return <Navigate to="/address-map" replace state={{ ...route.state, autoFocusSearch: true }} />;
}
