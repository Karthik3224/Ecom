import { useContext, useMemo, useState } from 'react';
import { Box, Button, MenuItem, Select, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import SafeProductImage from '../../components/SafeProductImage/SafeProductImage';
import logo from '../../assets/images/logo.png';
import { deliverySummary, isGlobalStore } from '../../utils/storeDelivery';
import './StoresListPage.css';

const stateName = (store = {}) => isGlobalStore(store) ? 'All India' : String(store.state || 'State not specified').trim();

const StoresListPage = () => {
  const navigate = useNavigate();
  const { catalogStores, formatCurrency, setDeliveryMode } = useContext(AppContext);
  const [selectedState, setSelectedState] = useState('All States');
  const activeStores = useMemo(() => catalogStores
    .filter((store) => store.active !== false && !['inactive', 'closed'].includes(String(store.status || '').toLowerCase()))
    .sort((left, right) => stateName(left).localeCompare(stateName(right)) || String(left.name).localeCompare(String(right.name))), [catalogStores]);
  const states = useMemo(() => [...new Set(activeStores.map(stateName))].sort((left, right) => left === 'All India' ? 1 : right === 'All India' ? -1 : left.localeCompare(right)), [activeStores]);
  const groupedStores = useMemo(() => {
    const visible = selectedState === 'All States' ? activeStores : activeStores.filter((store) => stateName(store) === selectedState);
    return visible.reduce((groups, store) => {
      const state = stateName(store);
      if (!groups[state]) groups[state] = [];
      groups[state].push(store);
      return groups;
    }, {});
  }, [activeStores, selectedState]);
  const openStore = (store) => {
    setDeliveryMode('delivery');
    localStorage.setItem('selectedStoreId', store.id);
    localStorage.setItem('selectedStore', store.name);
    navigate(`/stores/${encodeURIComponent(store.id)}`);
  };

  return <Box className="stores-list-page">
    <Header />
    <Box className="stores-list-titlebar"><Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/home')}>Back</Button><Typography variant="h5">Stores by State</Typography></Box>
    <Box className="stores-list-content">
      <Box className="stores-state-filter"><Typography fontWeight={800}>Select State</Typography><Select size="small" value={selectedState} onChange={(event) => setSelectedState(event.target.value)}><MenuItem value="All States">All States</MenuItem>{states.map((state) => <MenuItem key={state} value={state}>{state}</MenuItem>)}</Select></Box>
      {Object.keys(groupedStores).length === 0 ? <Typography className="stores-empty">No active stores are available for this state.</Typography> : Object.entries(groupedStores).map(([state, stores]) => <section key={state} className="stores-state-section">
        <Box className="stores-state-heading"><Typography variant="h6">{state}</Typography><Typography>{stores.length} store{stores.length === 1 ? '' : 's'}</Typography></Box>
        <Box className="stores-grid">{stores.map((store) => { const delivery = deliverySummary(store, formatCurrency); return <Box component="button" key={store.id} className="stores-card" onClick={() => openStore(store)}>
          <Box className="stores-card-image">{store.logoUrl || store.image ? <SafeProductImage src={store.logoUrl || store.image} fallback={logo} alt="" /> : <StorefrontOutlinedIcon />}</Box>
          <Box className="stores-card-copy"><Typography fontWeight={800}>{store.name}</Typography><Typography>{[store.area, store.city || store.location].filter(Boolean).join(', ')}</Typography><Typography className="stores-address">{store.address}</Typography><Typography className="stores-delivery">{isGlobalStore(store) ? 'India-wide delivery' : `${delivery.etaLabel} · ${delivery.chargeLabel}`}</Typography></Box>
        </Box>; })}</Box>
      </section>)}
    </Box>
    <BottomNav />
  </Box>;
};

export default StoresListPage;
