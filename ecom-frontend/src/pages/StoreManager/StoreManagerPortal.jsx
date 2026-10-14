import DeliveryPartners from './DeliveryPartners';
import { storeManagerNavItems as navItems } from '../../config/storeManagerNavigation';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Box, Button, Chip, MenuItem, Select, TextField, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { clearDeliveryQuoteCache, createStore, createStoreDeliveryZone, deleteStoreDeliveryZone, getStore, getStoreDeliveryZones, getStores, updateStore, updateStoreDeliveryZone } from '../../services/catalogApi';
import { collectionStore, orderStore, staffProfileStore } from '../../services/localDataService';
import { DELIVERY_MODE_OPTIONS } from '../../utils/storeDelivery';
import logo from '../../assets/images/logo.png';
import SafeProductImage from '../../components/SafeProductImage/SafeProductImage';
import './StoreManagerPortal.css';



const numberOrNull = (value) => value === '' || value === null || value === undefined ? null : Number(value);
const money = (value) => Number(value || 0).toLocaleString('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 });
const methodId = (method) => String(method || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const zoneLabel = (zone) => `${Number(zone.minRadiusKm || 0).toFixed(Number(zone.minRadiusKm || 0) % 1 ? 1 : 0)}-${Number(zone.maxRadiusKm || zone.radiusKm || 0).toFixed(Number(zone.maxRadiusKm || zone.radiusKm || 0) % 1 ? 1 : 0)} KM`;
const etaLabel = (zone, method) => method?.estimatedTime || [zone.estimatedDeliveryMin, zone.estimatedDeliveryMax].filter(Boolean).join('-') + (zone.estimatedDeliveryMin || zone.estimatedDeliveryMax ? ' min' : '');
const TILE_SIZE = 256;
const EARTH_CIRCUMFERENCE_METERS = 40075016.686;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lonToTileX = (lon, zoom) => ((lon + 180) / 360) * 2 ** zoom;
const latToTileY = (lat, zoom) => {
  const rad = lat * Math.PI / 180;
  return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * 2 ** zoom;
};
const metersPerPixel = (lat, zoom) => Math.cos(lat * Math.PI / 180) * EARTH_CIRCUMFERENCE_METERS / (TILE_SIZE * 2 ** zoom);
const isNotFound = (reason) => String(reason?.message || reason || '').toLowerCase().includes('not found');
const cleanApiMessage = (reason, fallback) => isNotFound(reason) ? fallback : reason?.message || fallback;
const storePayload = (store = {}) => {
  const latitude = Number(store.latitude);
  const longitude = Number(store.longitude);
  return {
    id:String(store.id || methodId(store.name) || '').trim(),
    name:String(store.name || store.storeName || 'Assigned Store').trim(),
    storeCode:store.storeCode || null,
    logoUrl:store.logoUrl || store.image || null,
    description:store.description || null,
    location:String(store.location || store.city || 'Hyderabad').trim(),
    address:String(store.address || [store.doorNumber, store.streetName, store.area, store.city || store.location, store.state, store.pincode].filter(Boolean).join(', ') || store.location || 'Store address').trim(),
    doorNumber:store.doorNumber || null,
    streetName:store.streetName || null,
    area:store.area || null,
    landmark:store.landmark || null,
    city:store.city || store.location || null,
    district:store.district || null,
    state:store.state || null,
    pincode:store.pincode || null,
    latitude:Number.isFinite(latitude) ? latitude : null,
    longitude:Number.isFinite(longitude) ? longitude : null,
    provider:store.provider || 'OPENSTREETMAP',
    providerPlaceId:store.providerPlaceId || null,
    providerOsmType:store.providerOsmType || null,
    providerOsmId:store.providerOsmId || null,
    locationAccuracyMeters:numberOrNull(store.locationAccuracyMeters),
    phone:store.phone || store.mobile || null,
    alternatePhone:store.alternatePhone || null,
    email:store.email || null,
    adminName:store.adminName || store.admin || null,
    storeRating:numberOrNull(store.storeRating),
    gstNumber:store.gstNumber || null,
    status:store.status || 'Active',
    deliveryEnabled:store.delivery !== 'No' && store.deliveryEnabled !== false,
    pickupEnabled:store.pickup !== 'No' && store.pickupEnabled !== false,
    deliveryRadiusKm:numberOrNull(store.deliveryRadiusKm),
    deliveryEtaMinutes:numberOrNull(store.deliveryEtaMinutes),
    deliveryCharge:numberOrNull(store.deliveryCharge),
    freeDeliveryAbove:numberOrNull(store.freeDeliveryAbove),
    deliveryModes:store.deliveryModes || DELIVERY_MODE_OPTIONS.slice(0, 3).join(','),
    deliveryNotes:store.deliveryNotes || null,
    isNew:store.isNew === true,
    active:store.status !== 'Inactive' && store.active !== false,
  };
};

const normalizeStore = (store = {}) => ({
  ...store,
  isNew: store.isNew === true,
  storeType: store.isNew === true ? 'New' : 'Old',
  delivery: store.delivery ?? (store.deliveryEnabled === false ? 'No' : 'Yes'),
  pickup: store.pickup ?? (store.pickupEnabled === false ? 'No' : 'Yes'),
  status: store.status || (store.active === false ? 'Inactive' : 'Active'),
});

const emptyRule = (radiusKm = '') => ({
  radiusKm,
  minRadiusKm: 0,
  maxRadiusKm: radiusKm,
  deliveryCharge: 20,
  freeDeliveryAbove: 499,
  minimumOrder: 100,
  estimatedDeliveryMin: 15,
  estimatedDeliveryMax: 20,
  status: 'Active',
  methods: DELIVERY_MODE_OPTIONS.map((deliveryType, index) => ({
    deliveryType,
    enabled: index < 3 || deliveryType === 'Store Pickup',
    deliveryCharge: deliveryType === 'Store Pickup' ? 0 : index === 1 ? 50 : index === 2 ? 40 : 20,
    estimatedTime: deliveryType === 'Store Pickup' ? 'Ready as scheduled' : '15-20 min',
    cutoffTime: '',
    settingsConfiguration: '{}',
  })),
});

const StoreMap = ({ store, rules, editingRule }) => {
  const [zoom, setZoom] = useState(12);
  const lat = Number(store?.latitude);
  const lng = Number(store?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return <Box className="sm-map-empty">Store latitude and longitude are required to show the map.</Box>;
  const circles = [...rules, editingRule].filter(Boolean)
    .map((rule) => Number(rule.radiusKm || rule.maxRadiusKm))
    .filter((value, index, values) => value > 0 && values.indexOf(value) === index)
    .sort((a, b) => b - a);
  const centerX = lonToTileX(lng, zoom) * TILE_SIZE;
  const centerY = latToTileY(lat, zoom) * TILE_SIZE;
  const tileRange = 3;
  const centerTileX = Math.floor(centerX / TILE_SIZE);
  const centerTileY = Math.floor(centerY / TILE_SIZE);
  const tileOffsetX = centerX - centerTileX * TILE_SIZE;
  const tileOffsetY = centerY - centerTileY * TILE_SIZE;
  const tileCount = tileRange * 2 + 1;
  const tileBase = `calc(50% - ${tileOffsetX + tileRange * TILE_SIZE}px)`;
  const tileTop = `calc(50% - ${tileOffsetY + tileRange * TILE_SIZE}px)`;
  const maxTile = 2 ** zoom;
  const tileRows = Array.from({ length:tileCount * tileCount }, (_, index) => {
    const dx = index % tileCount - tileRange;
    const dy = Math.floor(index / tileCount) - tileRange;
    const x = ((centerTileX + dx) % maxTile + maxTile) % maxTile;
    const y = centerTileY + dy;
    return y >= 0 && y < maxTile ? { x, y, dx:dx + tileRange, dy:dy + tileRange } : null;
  }).filter(Boolean);
  const scale = metersPerPixel(lat, zoom);
  return <Box className="sm-map">
    <Box className="sm-tile-layer" style={{ left:tileBase, top:tileTop, width:tileCount * TILE_SIZE, height:tileCount * TILE_SIZE }}>
      {tileRows.map((tile) => <img key={`${zoom}-${tile.x}-${tile.y}`} src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`} alt="" style={{ left:tile.dx * TILE_SIZE, top:tile.dy * TILE_SIZE }} draggable="false" />)}
    </Box>
    <Box className="sm-map-controls">
      <Button size="small" aria-label="Zoom in" onClick={() => setZoom((value) => clamp(value + 1, 10, 16))}>+</Button>
      <Button size="small" aria-label="Zoom out" onClick={() => setZoom((value) => clamp(value - 1, 10, 16))}>-</Button>
    </Box>
    <span className="sm-store-pin">Store</span>
    {circles.map((radius) => {
      const size = radius * 1000 * 2 / scale;
      return <span key={radius} className="sm-radius-circle" style={{ width:`${size}px`, height:`${size}px` }}><b>{radius} KM</b></span>;
    })}
  </Box>;
};

const useAssignedStore = (user) => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const storeId = user?.storeId || collectionStore.list('stores').find((item) => item.name === user?.store || item.id === user?.store)?.id || '';
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
     
    setError('');
    const local = collectionStore.list('stores').find((item) => item.id === storeId || item.name === user?.store);
    const request = storeId
      ? getStore(storeId).catch(() => getStores().then((stores) => stores.find((item) => item.id === storeId || item.name === user?.store)))
      : getStores().then((stores) => stores.find((item) => item.name === user?.store));
    Promise.resolve(request)
      .then((payload) => {
        if (cancelled) return;
        const next = normalizeStore(payload || local || {});
        if (next.id) collectionStore.upsert('stores', next);
        setStore(next.id ? next : null);
        setError(next.id ? '' : 'Assigned store is not configured yet.');
      })
      .catch((reason) => {
        if (!cancelled) {
          setStore(local ? normalizeStore(local) : null);
          setError(local ? '' : reason.message || 'Could not load assigned store.');
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [storeId, user?.store]);
  return { store, setStore, loading, error };
};

const StoreManagerShell = ({ active, children, store }) => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AppContext);
  const openNav = (path) => {
    if (path === 'logout') {
      logout();
      navigate('/team-login');
      return;
    }
    navigate(path);
  };
  return <Box className="sm-shell">
    <aside className="sm-sidebar">
      <Box className="sm-brand"><img src={logo} alt="Spices and Pickles"/><Box><Typography variant="h6">Store Manager</Typography><Typography>{store?.name || user?.store || 'Assigned store'}</Typography></Box></Box>
      <nav>{navItems.map(([id, label, Icon, path]) => <Button key={id} className={active === id ? 'active' : ''} startIcon={<Icon/>} onClick={() => openNav(path)}><span>{label}</span></Button>)}</nav>
      <Button className="sm-customer-link" onClick={() => navigate('/home')}>View Customer App</Button>
    </aside>
    <main className="sm-main">
      <header className="sm-topbar"><Button startIcon={<MenuIcon/>} onClick={() => navigate('/store-manager/dashboard')}>Store Manager</Button><Button className="sm-user" onClick={() => navigate('/store-manager/profile')}><Avatar>{(user?.name || 'S')[0]}</Avatar><span>{user?.name || 'Manager'}</span></Button><Button color="error" onClick={() => { logout(); navigate('/team-login'); }}>Sign out</Button></header>
      {children}
    </main>
  </Box>;
};

const DeliveryPartnersPage = () => <StoreManagerShell active="delivery-partners"><DeliveryPartners /></StoreManagerShell>;

const StoreProfilePage = ({ mode = 'profile' }) => {
  const { user, setUser, updateCatalogStore } = useContext(AppContext);
  const { store, setStore, loading, error } = useAssignedStore(user);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const isPassword = mode === 'change-password';
  const isSettings = mode === 'delivery-settings';
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (store) setForm({ ...store, managerName:store.adminName || user?.name || '', mobile:store.phone || user?.mobile || user?.phone || '', currentPassword:'', newPassword:'', confirmPassword:'' });
  }, [store, user]);
  const change = (key, value) => setForm((current) => ({ ...current, [key]:value }));
  const save = async () => {
    const next = {};
    if (!isPassword && !String(form.name || '').trim()) next.name = 'Store name is required.';
    if (isPassword && form.newPassword !== form.confirmPassword) next.confirmPassword = 'New passwords do not match.';
    if (isPassword && String(form.newPassword || '').length < 6) next.newPassword = 'New password must contain at least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      let updatedStore = store;
      if (!isPassword) {
        updatedStore = normalizeStore(await updateStore(store.id, {
          ...store,
          ...form,
          adminName: form.managerName,
          phone: form.mobile,
          deliveryEnabled: form.delivery !== 'No',
          pickupEnabled: form.pickup !== 'No',
          deliveryRadiusKm: numberOrNull(form.deliveryRadiusKm),
          deliveryEtaMinutes: numberOrNull(form.deliveryEtaMinutes),
          deliveryCharge: numberOrNull(form.deliveryCharge),
          freeDeliveryAbove: numberOrNull(form.freeDeliveryAbove),
          isNew: form.storeType === 'New',
          active: form.status !== 'Inactive',
        }));
        collectionStore.upsert('stores', updatedStore);
        clearDeliveryQuoteCache();
        setStore(updatedStore);
        updateCatalogStore(updatedStore);
      }
      const updatedUser = await staffProfileStore.update({ name:form.managerName || user?.name, phone:form.mobile, mobile:form.mobile, email:user?.email, location:updatedStore?.location || user?.location, store:updatedStore?.name || user?.store, storeId:updatedStore?.id || user?.storeId, currentPassword:form.currentPassword, newPassword:form.newPassword, confirmPassword:form.confirmPassword }, user);
      setUser(updatedUser);
      setEditing(false);
      setMessage('Changes saved.');
    } catch (reason) {
      setErrors({ form:reason.message || 'Could not save changes.' });
    }
  };
  const fields = isPassword
    ? [['currentPassword', 'Current Password', 'password'], ['newPassword', 'New Password', 'password'], ['confirmPassword', 'Confirm Password', 'password']]
    : isSettings
      ? [['delivery', 'Delivery Enabled', 'select', ['Yes', 'No']], ['pickup', 'Store Pickup Enabled', 'select', ['Yes', 'No']], ['deliveryEtaMinutes', 'Default Preparation / ETA Minutes', 'number'], ['deliveryNotes', 'General Delivery Notes', 'textarea'], ['status', 'Store Status', 'select', ['Active', 'Inactive', 'Temporarily Closed']]]
      : [['name', 'Store Name'], ['storeCode', 'Store Code'], ['description', 'Description', 'textarea'], ['managerName', 'Manager Name'], ['mobile', 'Mobile Number'], ['alternatePhone', 'Alternate Mobile'], ['email', 'Email'], ['doorNumber', 'Door Number'], ['streetName', 'Road / Street'], ['area', 'Area'], ['landmark', 'Landmark'], ['city', 'City'], ['district', 'District'], ['state', 'State'], ['pincode', 'Pincode'], ['latitude', 'Latitude', 'number'], ['longitude', 'Longitude', 'number'], ['openingTime', 'Opening Time', 'time'], ['closingTime', 'Closing Time', 'time'], ['gstNumber', 'GST Number'], ['storeType', 'Store Type', 'select', ['New', 'Old']], ['pickup', 'Store Pickup Available', 'select', ['Yes', 'No']], ['delivery', 'Delivery Available', 'select', ['Yes', 'No']], ['status', 'Store Status', 'select', ['Active', 'Inactive', 'Temporarily Closed']]];
  return <StoreManagerShell active={mode === 'delivery-settings' ? 'delivery-settings' : mode === 'change-password' ? 'change-password' : 'profile'} store={store}>
    <Box className="sm-page-title"><Box><Typography variant="h4">{isPassword ? 'Change Password' : isSettings ? 'Delivery Settings' : 'Store Profile'}</Typography><Typography>{store?.name || 'Assigned store'}</Typography></Box>{!isPassword && !isSettings && <Chip label={store?.status || 'Active'} color={store?.status === 'Inactive' ? 'default' : 'success'}/>}</Box>
    {error && <Alert severity="warning">{error}</Alert>}
    {message && <Alert severity="success">{message}</Alert>}
    {loading || !store ? <Typography>Loading store...</Typography> : <Box className="sm-profile-layout">
      {!isPassword && <section className="sm-profile-hero"><Box className="sm-store-logo">{store.logoUrl ? <SafeProductImage src={store.logoUrl} fallback={logo} alt="Store logo"/> : <StorefrontOutlinedIcon/>}</Box><Box><Typography variant="h5">{store.name || 'Fresh Mart'}</Typography><Typography>{store.id} {store.storeCode ? `/ ${store.storeCode}` : ''}</Typography></Box><Button variant="outlined" onClick={() => setEditing((value) => !value)}>{editing ? 'Cancel Edit' : 'Edit Profile'}</Button></section>}
      {!isSettings && !isPassword && <StoreMap store={form} rules={[]} />}
      <section className="sm-form-grid">
        {fields.map(([key, label, type = 'text', options = []]) => <Box key={key}>{type === 'select' ? <Select fullWidth disabled={!editing && !isPassword && !isSettings} value={form[key] || ''} onChange={(event) => change(key, event.target.value)} displayEmpty><MenuItem value="" disabled>{label}</MenuItem>{options.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}</Select> : <TextField fullWidth label={label} type={type === 'textarea' ? 'text' : type} multiline={type === 'textarea'} minRows={type === 'textarea' ? 3 : undefined} disabled={!editing && !isPassword && !isSettings} value={form[key] || ''} onChange={(event) => change(key, event.target.value)} error={Boolean(errors[key])} helperText={errors[key]}/>}</Box>)}
        {errors.form && <Alert severity="error" sx={{ gridColumn:'1 / -1' }}>{errors.form}</Alert>}
      </section>
      <Box className="sm-actions"><Button variant="contained" onClick={save}>{isPassword ? 'Change Password' : 'Save Changes'}</Button></Box>
    </Box>}
  </StoreManagerShell>;
};

const DeliveryRadiusPage = () => {
  const { user } = useContext(AppContext);
  const { store, setStore, loading, error } = useAssignedStore(user);
  const [rules, setRules] = useState([]);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const storeId = store?.id;
  const ensureCatalogStore = async () => {
    if (!store?.id) throw new Error('Assigned store is required before saving delivery radius.');
    try {
      return await getStore(store.id);
    } catch (reason) {
      if (!isNotFound(reason)) throw reason;
      const payload = storePayload(store);
      if (!payload.id || !payload.name || !payload.location || !payload.address || payload.latitude == null || payload.longitude == null) {
        throw new Error('Complete store profile with address, latitude, and longitude before saving delivery radius.', { cause: reason });
      }
      try {
        const saved = normalizeStore(await createStore(payload));
        collectionStore.upsert('stores', saved);
        setStore(saved);
        return saved;
      } catch (createReason) {
        if (!String(createReason?.message || '').toLowerCase().includes('already exists')) throw createReason;
        const stores = await getStores();
        const existing = stores.find((item) => item.id === store.id || item.name === store.name);
        if (!existing) throw createReason;
        const saved = normalizeStore(existing);
        collectionStore.upsert('stores', saved);
        setStore(saved);
        return saved;
      }
    }
  };
  const loadRules = async () => {
    if (!storeId) return;
    try {
      const catalogStore = await ensureCatalogStore();
      const payload = await getStoreDeliveryZones(catalogStore.id);
      setMessage('');
      setErrors({});
      setRules((payload || []).map((zone) => ({ ...zone, radiusKm:Number(zone.maxRadiusKm), methods:(zone.methods || []).length ? zone.methods : emptyRule(zone.maxRadiusKm).methods })).sort((a, b) => Number(a.radiusKm) - Number(b.radiusKm)));
    } catch (reason) {
      const localRules = collectionStore.list('deliveryZones').filter((zone) => zone.storeId === storeId);
      if (localRules.length) {
        setRules(localRules.map((zone) => ({ ...zone, radiusKm:Number(zone.maxRadiusKm || zone.radiusKm), methods:(zone.methods || []).length ? zone.methods : emptyRule(zone.maxRadiusKm || zone.radiusKm).methods })).sort((a, b) => Number(a.radiusKm) - Number(b.radiusKm)));
        setMessage('');
        setErrors({});
        return;
      }
      setMessage(reason.message && reason.message !== 'Not Found' ? reason.message : '');
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRules().catch((reason) => setMessage(cleanApiMessage(reason, '')));
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeRules = editing ? rules.map((rule) => rule.id === editing.id ? editing : rule).concat(editing.id ? [] : [editing]) : rules;
  const sortedRules = [...activeRules].sort((a, b) => Number(a.radiusKm || a.maxRadiusKm) - Number(b.radiusKm || b.maxRadiusKm));
  const persistRule = async (rule, payload) => {
    const catalogStore = await ensureCatalogStore();
    if (!rule.id) return createStoreDeliveryZone(catalogStore.id, payload);
    try {
      return await updateStoreDeliveryZone(catalogStore.id, rule.id, payload);
    } catch (reason) {
      if (isNotFound(reason)) return createStoreDeliveryZone(catalogStore.id, payload);
      throw reason;
    }
  };
  const saveRule = async () => {
    setMessage('');
    setErrors({});
    const radius = Number(editing.radiusKm || editing.maxRadiusKm);
    const duplicate = rules.some((rule) => rule.id !== editing.id && Number(rule.radiusKm || rule.maxRadiusKm) === radius);
    const next = {};
    if (!(radius > 0)) next.radiusKm = 'Radius must be greater than 0.';
    if (duplicate) next.radiusKm = `A ${radius} KM delivery radius already exists.`;
    setErrors(next);
    if (Object.keys(next).length) return;
    const merged = [...rules.filter((rule) => rule.id !== editing.id), { ...editing, radiusKm:radius, maxRadiusKm:radius }].sort((a, b) => Number(a.radiusKm) - Number(b.radiusKm));
    let previous = 0;
    const normalized = merged.map((rule) => {
      const max = Number(rule.radiusKm || rule.maxRadiusKm);
      const zone = { ...rule, minRadiusKm:previous, maxRadiusKm:max };
      previous = max;
      return zone;
    });
    try {
      for (const rule of normalized) {
        const payload = {
          minRadiusKm:Number(rule.minRadiusKm),
          maxRadiusKm:Number(rule.maxRadiusKm),
          estimatedDeliveryMin:numberOrNull(rule.estimatedDeliveryMin),
          estimatedDeliveryMax:numberOrNull(rule.estimatedDeliveryMax),
          deliveryCharge:Number(rule.deliveryCharge || 0),
          freeDeliveryAbove:numberOrNull(rule.freeDeliveryAbove),
          minimumOrder:numberOrNull(rule.minimumOrder),
          status:rule.status || 'Active',
          methods:(rule.methods || []).map((method) => ({ ...method, enabled:Boolean(method.enabled), deliveryCharge:Number(method.deliveryCharge || 0), settingsConfiguration:method.settingsConfiguration || '{}' })),
        };
        await persistRule(rule, payload);
      }
      setEditing(null);
      clearDeliveryQuoteCache();
      setMessage('Delivery radius rules saved.');
      await loadRules();
    } catch (reason) {
      setErrors({ form:cleanApiMessage(reason, 'Could not save radius to the database.') });
    }
  };
  const removeRule = async (rule) => {
    setMessage('');
    setErrors({});
    try {
      const catalogStore = await ensureCatalogStore();
      if (rule.id) {
        try {
          await deleteStoreDeliveryZone(catalogStore.id, rule.id);
        } catch (reason) {
          if (!isNotFound(reason)) throw reason;
        }
      }
      clearDeliveryQuoteCache();
      setRules((current) => current.filter((item) => item.id !== rule.id));
      setMessage('Delivery radius deleted.');
      await loadRules();
    } catch (reason) {
      setErrors({ form:cleanApiMessage(reason, 'Could not delete radius from the database.') });
    }
  };
  const updateMethod = (deliveryType, patch) => setEditing((current) => ({ ...current, methods:(current.methods || emptyRule().methods).map((method) => method.deliveryType === deliveryType ? { ...method, ...patch } : method) }));
  return <StoreManagerShell active="delivery-radius" store={store}>
    <Box className="sm-page-title"><Box><Typography variant="h4">Delivery Radius & Service Area</Typography><Typography>{store?.name || 'Assigned store'} {store?.location ? `- ${store.location}` : ''}</Typography></Box><Button variant="contained" onClick={() => setEditing(emptyRule(3))}>+ Add Delivery Radius</Button></Box>
    {error && <Alert severity="warning">{error}</Alert>}
    {message && <Alert severity="info">{message}</Alert>}
    {errors.form && <Alert severity="error">{errors.form}</Alert>}
    {loading || !store ? <Typography>Loading delivery radius...</Typography> : <Box className="sm-radius-layout">
      <StoreMap store={store} rules={rules} editingRule={editing} />
      <aside className="sm-radius-panel">
        <Typography variant="h6">Delivery Radius Rules</Typography>
        {sortedRules.map((rule, index) => <Box className={`sm-rule-card ${editing === rule ? 'editing' : ''}`} key={rule.id || `draft-${index}`}>
          <Box className="sm-rule-head"><Typography fontWeight={800}>{zoneLabel(rule)}</Typography><Chip label={rule.status || 'Active'} size="small"/></Box>
          <Typography>{money(rule.deliveryCharge)} Standard Delivery</Typography>
          <Typography color="text.secondary">{etaLabel(rule)}</Typography>
          <Box className="sm-method-tags">{(rule.methods || []).filter((method) => method.enabled).map((method) => <Chip key={method.deliveryType} label={method.deliveryType.replace(' Delivery', '')} size="small"/>)}</Box>
          <Box><Button onClick={() => setEditing({ ...rule, methods:rule.methods || [] })}>Edit</Button><Button color="error" onClick={() => removeRule(rule)}>Delete</Button></Box>
        </Box>)}
        {editing && <Box className="sm-editor">
          <Typography variant="h6">{editing.id ? 'Edit Radius' : 'Add Radius'}</Typography>
          <TextField label="Radius KM" type="number" value={editing.radiusKm || ''} onChange={(event) => setEditing({ ...editing, radiusKm:event.target.value, maxRadiusKm:event.target.value })} error={Boolean(errors.radiusKm)} helperText={errors.radiusKm || 'The map preview updates immediately.'}/>
          <TextField label="Delivery Charge" type="number" value={editing.deliveryCharge || ''} onChange={(event) => setEditing({ ...editing, deliveryCharge:event.target.value })}/>
          <TextField label="Free Delivery Above" type="number" value={editing.freeDeliveryAbove || ''} onChange={(event) => setEditing({ ...editing, freeDeliveryAbove:event.target.value })}/>
          <TextField label="Minimum Order" type="number" value={editing.minimumOrder || ''} onChange={(event) => setEditing({ ...editing, minimumOrder:event.target.value })}/>
          <Box className="sm-two"><TextField label="ETA Min" type="number" value={editing.estimatedDeliveryMin || ''} onChange={(event) => setEditing({ ...editing, estimatedDeliveryMin:event.target.value })}/><TextField label="ETA Max" type="number" value={editing.estimatedDeliveryMax || ''} onChange={(event) => setEditing({ ...editing, estimatedDeliveryMax:event.target.value })}/></Box>
          <Typography fontWeight={800}>Delivery Types</Typography>
          {(editing.methods || emptyRule().methods).map((method) => <Box className="sm-method-editor" key={method.deliveryType}><Button variant={method.enabled ? 'contained' : 'outlined'} onClick={() => updateMethod(method.deliveryType, { enabled:!method.enabled })}>{method.deliveryType}</Button><TextField label="Charge" type="number" value={method.deliveryCharge ?? ''} onChange={(event) => updateMethod(method.deliveryType, { deliveryCharge:event.target.value })}/><TextField label="ETA" value={method.estimatedTime || ''} onChange={(event) => updateMethod(method.deliveryType, { estimatedTime:event.target.value })}/></Box>)}
          <Box className="sm-actions"><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" onClick={saveRule}>Save Radius</Button></Box>
        </Box>}
      </aside>
    </Box>}
  </StoreManagerShell>;
};

const StoreOrdersPage = () => {
  const { user } = useContext(AppContext);
  const { store } = useAssignedStore(user);
  const orders = useMemo(() => orderStore.list().filter((order) => order.storeId === store?.id || order.sourceStore === store?.name || order.store === store?.name), [store]);
  return <StoreManagerShell active="orders" store={store}>
    <Box className="sm-page-title"><Box><Typography variant="h4">Store Orders</Typography><Typography>{store?.name || user?.store}</Typography></Box></Box>
    <Box className="sm-orders-list">{orders.length ? orders.map((order) => <Box className="sm-order-card" key={order.id}><Box><Typography fontWeight={900}>{order.orderNumber || order.id}</Typography><Typography>Customer: {order.customer?.name || order.customerName || 'Customer'}</Typography><Typography>Distance: {order.calculatedDistanceKm || order.checkout?.deliveryQuote?.distanceKm || '--'} KM</Typography><Typography>Zone: {order.deliveryZoneLabel || (order.checkout?.deliveryQuote?.deliveryZoneId ? `Zone ${order.checkout.deliveryQuote.deliveryZoneId}` : '--')}</Typography></Box><Box><Typography>Delivery: {order.deliveryMethod || order.checkout?.deliveryQuote?.selectedDeliveryMethod || order.checkout?.method || '--'}</Typography><Typography>ETA: {order.estimatedDeliveryMin && order.estimatedDeliveryMax ? `${order.estimatedDeliveryMin}-${order.estimatedDeliveryMax} min` : '--'}</Typography><Typography>Delivery Charge: {money(order.deliveryCharge || order.checkout?.deliveryFee || 0)}</Typography><Typography>Total: {money(order.totalAmount || order.total || 0)}</Typography></Box><Chip label={order.status}/></Box>) : <Typography color="text.secondary">No orders for this store yet.</Typography>}</Box>
  </StoreManagerShell>;
};

const StoreManagerDashboard = () => {
  const { user } = useContext(AppContext);
  const { store } = useAssignedStore(user);
  const orders = orderStore.list().filter((order) => order.storeId === store?.id || order.sourceStore === store?.name || order.store === store?.name);
  return <StoreManagerShell active="dashboard" store={store}>
    <Box className="sm-page-title"><Box><Typography variant="h4">Welcome back, {user?.name || 'Store Manager'}</Typography><Typography>{store?.name || user?.store}</Typography></Box></Box>
    <Box className="sm-stat-grid">{[['Orders', orders.length], ['Active Orders', orders.filter((order) => !['DELIVERED', 'Delivered', 'CANCELLED', 'Cancelled'].includes(order.status)).length], ['Revenue', money(orders.reduce((sum, order) => sum + Number(order.totalAmount || order.total || 0), 0))], ['Store Status', store?.status || 'Active']].map(([label, value]) => <Box className="sm-stat" key={label}><Typography>{label}</Typography><Typography variant="h5">{value}</Typography></Box>)}</Box>
    <Box className="sm-actions"><Button variant="contained" onClick={() => window.location.assign('/store-manager/delivery-radius')}>Manage Delivery Radius</Button><Button variant="outlined" onClick={() => window.location.assign('/store-manager/orders')}>View Orders</Button></Box>
  </StoreManagerShell>;
};

const StoreManagerPortal = ({ page }) => {
  if (page === 'profile') return <StoreProfilePage />;
  if (page === 'delivery-partners') return <DeliveryPartnersPage />;
  if (page === 'delivery-radius') return <DeliveryRadiusPage />;
  if (page === 'delivery-settings') return <StoreProfilePage mode="delivery-settings" />;
  if (page === 'orders') return <StoreOrdersPage />;
  if (page === 'change-password') return <StoreProfilePage mode="change-password" />;
  return <StoreManagerDashboard />;
};

export default StoreManagerPortal;
