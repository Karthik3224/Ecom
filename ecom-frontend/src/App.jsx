import LocationSelectionModal from './components/LocationSelectionModal/LocationSelectionModal';
import { Outlet, useLocation } from "react-router-dom";
import CartDrawer from "./components/CartDrawer/CartDrawer";
import CartAddedPopover from "./components/CartAddedPopover/CartAddedPopover";
import "./App.css";

function App() {
  const { pathname } = useLocation();
  const shoppingLocation = pathname === "/home" || pathname === "/search" || pathname === "/stores" || pathname.startsWith("/stores/");
  return (
    <div className="app-container">
      <div className="mobile-screen-wrapper">
        <Outlet />
      </div>
      <CartAddedPopover />
      <CartDrawer />
      {shoppingLocation && <LocationSelectionModal />}
    </div>
  );
}

export default App;
