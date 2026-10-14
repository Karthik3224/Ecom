import { useContext, useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { hasCompleteProfile } from '../../utils/profileCompletion';
import { checkoutReviewError } from '../../utils/checkoutPolicy';
import { collectionStore } from '../../services/localDataService';
import { calculateCouponDiscount, cartPromotionContext, consumePendingCouponCode, findCouponByCode, validateCoupon } from '../../services/couponService';
import { getStoreDeliveryQuote } from '../../services/catalogApi';
import { resolveProductStore } from '../../services/productStoreResolver';
import { buildCartDeliveryLines, hasGlobalDelivery, totalDeliveryCharge } from '../../services/cartDeliveryLines';
import { deliveryMethodId, isGlobalProduct, preferredDeliveryMethod, sortDeliveryMethods } from '../../utils/storeDelivery';
import { openStreetMapEmbedUrl } from '../../services/openStreetMapService';
import { formatIndianMobile, isValidIndianMobile } from '../../utils/phoneValidation';

const normalizeAddressText = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
const displayAddressType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'home') return 'Home';
  if (normalized === 'office' || normalized === 'work') return 'Office';
  if (normalized === 'other') return 'Other';
  return 'Home';
};

const fallbackMethods = [
  { id: 'instant', label: 'Instant Delivery' },
  { id: 'standard', label: 'Standard Delivery' },
  { id: 'scheduled', label: 'Scheduled Delivery' },
  { id: 'pickup', label: 'Store Pickup / Takeaway' },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, deliveryAddress, setDeliveryAddress, user, addresses, orderAddresses, formatCurrency, userCity, catalogProducts, deliveryMode, setDeliveryMode, selectedLocation, clearSelectedLocation } = useContext(AppContext);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [method, setMethod] = useState(() => deliveryMode === 'pickup' ? 'pickup' : '');
  const [methodChangedByUser, setMethodChangedByUser] = useState(false);
  const [storeMethods, setStoreMethods] = useState({});
  const [date, setDate] = useState('');
  const [scheduleDateOffset, setScheduleDateOffset] = useState(0);
  const [slot, setSlot] = useState('');
  const [pickupOption, setPickupOption] = useState('standard');
  const pickupStores = collectionStore.list('stores').filter((store) => store.status !== 'Inactive' && store.active !== false && store.pickup !== 'No');
  const [pickupStore, setPickupStore] = useState(() => {
    const selected = localStorage.getItem('selectedStore');
    return pickupStores.some((store) => store.name === selected) ? selected : '';
  });
  useEffect(() => {
    if (deliveryMode === 'pickup') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMethod('pickup');
       
      setMethodChangedByUser(true);
    } else if (method === 'pickup') {
       
      setMethod('');
       
      setMethodChangedByUser(false);
    }
  }, [deliveryMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const [notes, setNotes] = useState('');
  const [deliveryInstructionsOpen, setDeliveryInstructionsOpen] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [deliveryPhotos, setDeliveryPhotos] = useState([]);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null);
  const [deliveryLines, setDeliveryLines] = useState([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const selectableAddresses = useMemo(() => {
    const savedKeys = new Set(addresses.map((item) => normalizeAddressText(item.address)));
    const past = (orderAddresses || []).filter((item) => !savedKeys.has(normalizeAddressText(item.address)));
    return { saved: addresses, past, all: [...addresses, ...past] };
  }, [addresses, orderAddresses]);
  useEffect(() => {
    if (selectedLocation?.address) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAddressId('selected-location');
      if (deliveryAddress !== selectedLocation.address) {
         
        setDeliveryAddress(selectedLocation.address);
      }
      return;
    }
    if (selectedAddressId && selectableAddresses.all.some((item) => item.id === selectedAddressId)) return;
    const preferred = addresses.find((item) => item.isDefault) || selectableAddresses.all[0];
    if (preferred) {
       
      setSelectedAddressId(preferred.id);
       
      setDeliveryAddress(preferred.address);
    }
  }, [selectableAddresses, selectedAddressId, addresses, setDeliveryAddress, selectedLocation, deliveryAddress]);
  const matchingSavedAddress = selectedLocation?.address
    ? addresses.find((item) => normalizeAddressText(item.address) === normalizeAddressText(selectedLocation.address))
    : null;
  const selectedLocationAddress = selectedLocation ? {
    id: 'selected-location',
    type: matchingSavedAddress?.type || 'Home',
    address: selectedLocation.address || selectedLocation.city || selectedLocation.title || '',
    coordinates: { lat: selectedLocation.latitude, lng: selectedLocation.longitude },
    latitude: selectedLocation.latitude,
    longitude: selectedLocation.longitude,
  } : null;
  const selectedAddress = selectedLocationAddress || selectableAddresses.all.find((item) => item.id === selectedAddressId)
    || addresses.find((item) => item.isDefault) || addresses[0] || {};
  const initialContactPhone = user?.phone || user?.mobile || selectedAddress.phone || '';
  const [contactPhone, setContactPhone] = useState(initialContactPhone);
  const [contactDraft, setContactDraft] = useState(initialContactPhone);
  const [contactEditing, setContactEditing] = useState(false);
  const [contactError, setContactError] = useState('');
  const customerLat = Number(selectedAddress.coordinates?.lat ?? selectedAddress.latitude);
  const customerLng = Number(selectedAddress.coordinates?.lng ?? selectedAddress.longitude);
  useEffect(() => {
    if (!hasCompleteProfile(user, [{}])) {
      navigate('/profile', { replace: true, state: { completeProfile: true, returnTo: '/checkout' } });
    } else if (!selectableAddresses.all.length) {
      navigate('/address-form', { replace: true, state: { returnTo: '/checkout', location: selectedLocation } });
    }
  }, [user, selectableAddresses, selectedLocation, navigate]);
  const source = resolveProductStore(cartItems[0] || {}, catalogProducts);
  const sourceStoreId = source?.storeId || '';
  const sourceStoreName = source?.store || cartItems[0]?.storeName || cartItems[0]?.store || cartItems[0]?.sourceStore;
  const checkoutStores = collectionStore.list('stores');
  const selectedStoreRef = localStorage.getItem('selectedStoreId') || localStorage.getItem('selectedStore');
  const currentSelectedStore = checkoutStores.find((store) => store.id === selectedStoreRef || store.name === selectedStoreRef);
  const selectedStore = currentSelectedStore || checkoutStores.find((store) => store.id === sourceStoreId || store.name === sourceStoreName) || null;
  const resolvedPickupStore = selectedStore?.name || sourceStoreName || pickupStore || '';
  const quoteStoreId = selectedStore?.id || sourceStoreId;
  useEffect(() => {
    if (deliveryMode === 'pickup' && resolvedPickupStore && pickupStore !== resolvedPickupStore) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPickupStore(resolvedPickupStore);
    }
  }, [deliveryMode, pickupStore, resolvedPickupStore]);
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [cartItems]);
  const activeMethod = method || 'standard';
  const isGlobalReview = hasGlobalDelivery(deliveryLines);
  const hasGlobalCart = cartItems.some(isGlobalProduct) || isGlobalReview;
  useEffect(() => {
    if (hasGlobalCart && activeMethod === 'pickup') {
      setDeliveryMode('delivery');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMethod('standard');
    }
  }, [hasGlobalCart, activeMethod, setDeliveryMode]);
  const deliveryFee = activeMethod === 'pickup' ? 0 : totalDeliveryCharge(deliveryLines);
  const deliveryGroups = deliveryLines.reduce((groups, line) => {
    const key = `${line.fulfillmentType || 'checking'}:${line.storeId || 'store'}:${line.deliveryType || 'delivery'}`;
    const existing = groups.find((group) => group.key === key);
    const group = existing || { key, line, lines: [] };
    group.lines.push(line);
    if (!existing) groups.push(group);
    return groups;
  }, []);
  const selectedQuoteMethod = quote?.methods?.find((item) => deliveryMethodId(item.deliveryType) === activeMethod);
  const quoteEta = selectedQuoteMethod?.estimatedTime || (quote?.estimatedDeliveryMin && quote?.estimatedDeliveryMax ? `${quote.estimatedDeliveryMin}-${quote.estimatedDeliveryMax} minutes` : '');
  const deliveryWindow = quoteEta || selectedQuoteMethod?.estimatedTime || '55-62 min';
  const availableQuoteMethod = (quote?.methods || []).some((item) => deliveryMethodId(item.deliveryType) === activeMethod);
  const selectedMethodUnavailable = quote?.deliveryAvailable === false && quote?.deliveryZoneId && quote?.methods?.length && !availableQuoteMethod;
  const availableMethods = useMemo(() => {
    if (isGlobalReview) {
      return [{ id: 'global', label: 'Global Delivery', caption: 'Delivered in 5-7 days' }];
    }
    if (quote && quote.deliveryAvailable === false && !quote.deliveryZoneId) {
      return [{ id: activeMethod, label: '5-7 days delivery', caption: 'Long distance delivery' }];
    }
    const quoted = sortDeliveryMethods(quote?.methods || []).map((item) => ({
      id: deliveryMethodId(item.deliveryType),
      label: item.deliveryType,
      caption: [item.estimatedTime, Number(item.deliveryCharge || 0) > 0 ? formatCurrency(item.deliveryCharge) : 'Free'].filter(Boolean).join(' - '),
    })).filter((item) => item.id !== 'express' && item.id !== 'same-day');
    const methodById = new Map((quoted.length ? quoted : fallbackMethods).map((item) => [item.id, item]));
    return [
      methodById.get('instant') || { id: 'instant', label: 'Instant Delivery', caption: deliveryWindow },
      methodById.get('standard') || { id: 'standard', label: 'Standard Delivery', caption: deliveryWindow },
      methodById.get('scheduled') || { id: 'scheduled', label: 'Scheduled Delivery', caption: 'Choose date & time' },
    ];
  }, [activeMethod, deliveryWindow, formatCurrency, isGlobalReview, quote]);
  const discount = appliedCoupon ? calculateCouponDiscount(appliedCoupon, subtotal) : 0;
  const total = subtotal + deliveryFee + (cartItems.length ? 5 : 0) - discount;
  const selectedAddressLabel = displayAddressType(selectedAddress.type);
  const selectedAddressText = selectedLocation?.address || deliveryAddress || selectedAddress.address || 'Select delivery address';
  const chooseSavedAddress = (address) => {
    clearSelectedLocation();
    setSelectedAddressId(address.id);
    setDeliveryAddress(address.address);
    setAddressPickerOpen(false);
    setError('');
  };
  const checkoutMapUrl = Number.isFinite(customerLat) && Number.isFinite(customerLng) ? openStreetMapEmbedUrl({ lat: customerLat, lng: customerLng, delta: 0.006 }) : '';
  const isScheduledPickup = activeMethod === 'pickup' && pickupOption === 'schedule';
  const scheduleDates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 3 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() + scheduleDateOffset + index);
      return {
        value: day.toISOString().slice(0, 10),
        title: scheduleDateOffset + index === 0 ? 'Today' : scheduleDateOffset + index === 1 ? 'Tomorrow' : day.toLocaleDateString('en-IN', { weekday: 'short' }),
        subtitle: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      };
    });
  }, [scheduleDateOffset]);
  const scheduleSlots = ['6:30 AM-7:00 AM', '6:45 AM-7:15 AM', '7:00 AM-7:30 AM', '7:15 AM-7:45 AM', '7:30 AM-8:00 AM', '7:45 AM-8:15 AM', '8:00 AM-8:30 AM', '8:15 AM-8:45 AM'];
  const selectedScheduleDate = scheduleDates.find((item) => item.value === date) || scheduleDates[0];
  const selectedScheduleSlot = slot || scheduleSlots[0];
  const scheduleSummary = `${selectedScheduleDate?.title || 'Today'}, ${selectedScheduleSlot}`;
  const chooseScheduledMethod = () => {
    if (!date) setDate(scheduleDates[0]?.value || new Date().toISOString().slice(0, 10));
    if (!slot) setSlot(scheduleSlots[0]);
    setError('');
  };
  const showNextScheduleDates = () => {
    setScheduleDateOffset((currentOffset) => {
      const nextOffset = currentOffset + 1;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + nextOffset);
      setDate(nextDate.toISOString().slice(0, 10));
      if (!slot) setSlot(scheduleSlots[0]);
      setError('');
      return nextOffset;
    });
  };

  useEffect(() => {
    if (activeMethod === 'express' || activeMethod === 'same-day') {
      // Normalize legacy delivery methods when a persisted cart is restored.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMethod('standard');
      setMethodChangedByUser(false);
    }
  }, [activeMethod]);

  useEffect(() => {
    if (isGlobalReview || activeMethod === 'global') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuote(null);
       
      setQuoteError('');
       
      setQuoteLoading(false);
      return undefined;
    }
    if (!quoteStoreId || !Number.isFinite(customerLat) || !Number.isFinite(customerLng) || activeMethod === 'pickup') {
       
      setQuote(null);
       
      setQuoteError(activeMethod === 'pickup' ? '' : 'Select a saved address with map coordinates to calculate delivery.');
      return undefined;
    }
    let cancelled = false;
     
    setQuoteLoading(true);
     
    setQuoteError('');
    getStoreDeliveryQuote(quoteStoreId, { latitude: customerLat, longitude: customerLng, orderTotal: subtotal, deliveryMethod: activeMethod })
      .then((data) => {
        if (cancelled) return;
        setQuote(data);
        setQuoteError(data?.deliveryAvailable ? '' : data?.message || 'Outside local delivery radius. This order will use Global Fulfillment.');
        const hasRequestedMethod = (data?.methods || []).some((item) => deliveryMethodId(item.deliveryType) === activeMethod);
        if (activeMethod !== 'scheduled' && data?.deliveryAvailable === false && data?.deliveryZoneId && data?.methods?.length && !hasRequestedMethod) {
          const fallback = preferredDeliveryMethod({ ...data, deliveryAvailable: true });
          if (fallback) {
            setMethod(deliveryMethodId(fallback));
            setMethodChangedByUser(false);
            setError('');
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(err.message || 'Could not calculate delivery for this address.');
        }
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });
    return () => { cancelled = true; };
  }, [isGlobalReview, quoteStoreId, customerLat, customerLng, activeMethod, subtotal]);

  useEffect(() => {
    if (!cartItems.length || activeMethod === 'pickup') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDeliveryLines([]);
      return undefined;
    }
    let cancelled = false;
     
    setQuoteLoading(true);
    buildCartDeliveryLines({ cartItems, catalogProducts, latitude: customerLat, longitude: customerLng, defaultMethod: activeMethod === 'global' ? 'standard' : activeMethod, cached: false, storeMethods })
      .then((lines) => {
        if (cancelled) return;
        setDeliveryLines(lines);
        setQuoteError('');
      })
      .catch((reason) => {
        if (!cancelled) { setDeliveryLines([]); setQuoteError(reason.message || 'Store delivery details could not be loaded.'); }
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeMethod, cartItems, catalogProducts, customerLat, customerLng, quoteStoreId, storeMethods]);

  useEffect(() => {
    if (isGlobalReview) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMethod('global');
      return;
    }
    if (!quote?.deliveryAvailable || methodChangedByUser) return;
    const preferred = preferredDeliveryMethod(quote);
    if (preferred) setMethod(deliveryMethodId(preferred));
  }, [isGlobalReview, methodChangedByUser, quote]);

  const applyCouponCode = (value) => {
    const code = String(value || '').trim().toUpperCase();
    const match = findCouponByCode(code);
    const customerLocation = collectionStore.list('locations').find((item) => userCity.toLowerCase().includes(item.name.toLowerCase()))?.name || '';
    const context = cartPromotionContext({ cartItems, catalogProducts, fallbackLocation: customerLocation, fallbackStore: selectedStore?.name || sourceStoreName || '' });
    const result = validateCoupon(match, { subtotal, cartItems, catalogProducts, location: context.location || customerLocation, store: context.store });
    setCoupon(code);
    if (!result.valid) {
      setAppliedCoupon(null);
      setCouponMessage(result.message);
      return false;
    }
    setAppliedCoupon(match);
    setCouponMessage(result.message);
    return true;
  };

  const applyCoupon = () => applyCouponCode(coupon);

  useEffect(() => {
    const pending = consumePendingCouponCode();
    if (!pending) return undefined;
    const timer = window.setTimeout(() => applyCouponCode(pending), 0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const proceed = () => {
    if (!cartItems.length) return setError('Your cart is empty.');
    const policyError = checkoutReviewError({ groupCount: deliveryGroups.length, handlingFee: cartItems.length ? 5 : 0, discount, coupon: appliedCoupon?.name });
    if (policyError) return setError(policyError);
    if (activeMethod === 'pickup' && hasGlobalCart) return setError('Global products are delivery only (5-7 days).');
    if (activeMethod !== 'pickup' && deliveryLines.some((line) => line.deliveryType !== 'pickup' && (line.quoteUnavailable || (line.fulfillmentType !== 'global' && line.quote?.deliveryAvailable === false)))) return setError('Delivery is unavailable or could not be verified for one or more stores. Change your address or retry.');
    if (activeMethod !== 'pickup' && !(selectedLocation?.address || deliveryAddress)) return setError('Select a delivery address.');
    if (activeMethod !== 'pickup' && quoteLoading) return setError('Delivery quote is still loading.');
    if (activeMethod !== 'pickup' && !deliveryLines.length) return setError(quoteError || 'Delivery could not be checked for this address.');
    if (activeMethod !== 'pickup' && quote?.deliveryAvailable === false && !isGlobalReview && !selectedMethodUnavailable) return setError(quoteError || 'Selected delivery method is unavailable for this address.');
    if (activeMethod === 'scheduled' && (!date || !slot)) return setError('Select a date and time slot.');
    if (activeMethod === 'pickup' && !resolvedPickupStore) return setError('Select a pickup store.');
    if (isScheduledPickup && (!date || !slot)) return setError('Select a pickup date and time slot.');
    if (contactEditing) return setError('Save the Contact Number before continuing.');
    if (!isValidIndianMobile(contactPhone)) return setError('Enter a valid 10-digit Contact Number.');
    const checkoutDate = activeMethod === 'pickup' && !isScheduledPickup ? '' : date;
    const checkoutSlot = activeMethod === 'pickup' && !isScheduledPickup ? '' : slot;
    navigate('/payment-options', { state: { checkout: { method:isGlobalReview ? 'global' : activeMethod, deliveryMode: activeMethod === 'pickup' ? 'pickup' : 'delivery', fulfillmentType:isGlobalReview ? 'mixed' : 'nearby', channel:isGlobalReview ? 'Global Fulfillment' : 'Nearby Store', globalApproval:isGlobalReview ? 'Pending' : 'Not Required', deliveryLines, sourceStoreId:quoteStoreId, sourceStore:selectedStore?.name || sourceStoreName || quoteStoreId, sourceLocation:selectedStore?.location || '', sourceState:selectedStore?.state || '', date: checkoutDate, slot: checkoutSlot, pickupOption, pickupStore: resolvedPickupStore, notes: notes.trim(), coupon: appliedCoupon?.name || '', discount, subtotal, deliveryFee, handlingFee: cartItems.length ? 5 : 0, total, deliveryAddress: activeMethod === 'pickup' ? '' : (selectedLocation?.address || deliveryAddress), contactNumber: contactPhone, customerLocation:userCity, deliveryQuote: quote, customerLatitude: Number.isFinite(customerLat) ? customerLat : null, customerLongitude: Number.isFinite(customerLng) ? customerLng : null, storeLatitude: selectedStore?.latitude ?? null, storeLongitude: selectedStore?.longitude ?? null } } });
  };

  const editContactNumber = () => {
    setContactDraft(contactPhone);
    setContactError('');
    setContactEditing(true);
  };
  const saveContactNumber = () => {
    const normalized = formatIndianMobile(contactDraft);
    if (!normalized) {
      setContactError('Enter a valid 10-digit mobile number.');
      return;
    }
    setContactPhone(normalized);
    setContactDraft(normalized);
    setContactError('');
    setContactEditing(false);
    setError('');
  };

  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
    <Box sx={{ flexShrink: 0, bgcolor: '#075F40', color: 'white', p: 2, display: 'flex', gap: 2, alignItems: 'center' }}><Button sx={{ color: 'white' }} onClick={() => navigate(-1)}>Back</Button><Typography variant="h6">Checkout</Typography></Box>
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}><Box sx={{ width: { xs: '100%', sm: '94vw', lg: '92vw' }, maxWidth: 1440, mx: 'auto', p: { xs: 1.25, sm: 2, md: 3 }, pb: 6, display: 'grid', gap: 1.5, minWidth: 0, boxSizing: 'border-box' }}>
      <Box sx={{ bgcolor:'#eef2f7', borderRadius:999, p:.5, display:'grid', gridTemplateColumns:hasGlobalCart ? '1fr' : '1fr 1fr', gap:.5, width:'100%', boxSizing:'border-box' }}><Button variant={activeMethod !== 'pickup' ? 'contained' : 'text'} onClick={() => { setDeliveryMode('delivery'); setMethod(''); setMethodChangedByUser(false); }}>Delivery</Button>{!hasGlobalCart && <Button variant={activeMethod === 'pickup' ? 'contained' : 'text'} onClick={() => { setDeliveryMode('pickup'); setMethod('pickup'); setMethodChangedByUser(true); }}>Pick-up</Button>}</Box>
      {activeMethod !== 'pickup' && <Box sx={{ bgcolor: 'white', p: { xs: 1.5, sm: 2 }, borderRadius: 3, display: 'grid', gap: 1.25, minWidth: 0, overflow: 'hidden' }}>
        <Box sx={{ height: 128, borderRadius: 2, overflow: 'hidden', bgcolor: '#eef2f7', position: 'relative', border: '1px solid #e2e8f0', width:'100%' }}>
          {checkoutMapUrl ? <iframe title="Delivery location map" src={checkoutMapUrl} style={{ width:'100%', height:'100%', border:0, pointerEvents:'none' }} /> : <Box sx={{ height:'100%', display:'grid', placeItems:'center', color:'#64748b' }}>Select address to show map</Box>}
          <Button size="small" variant="contained" onClick={() => navigate('/address-map', { state: { returnTo: '/checkout' } })} sx={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)', bgcolor:'white', color:'#111827', boxShadow:2, '&:hover':{ bgcolor:'#f8fafc' } }}>Edit pin</Button>
        </Box>
        <Box onClick={() => setAddressPickerOpen(true)} sx={{ display:'flex', alignItems:'center', gap:1.25, py:1, cursor:'pointer', borderBottom:'1px solid #eef2f7' }}>
          <HomeOutlinedIcon sx={{ color:'#075F40' }} />
          <Box sx={{ flex:1, minWidth:0 }}>
            <Typography fontWeight={800}>{selectedAddressLabel}</Typography>
            <Typography sx={{ color:'#64748b', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>{selectedAddressText}</Typography>
          </Box>
          <ChevronRightIcon sx={{ color:'#94a3b8' }} />
        </Box>
        <Box role="button" tabIndex={0} onClick={() => setDeliveryInstructionsOpen(true)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setDeliveryInstructionsOpen(true); } }} sx={{ display:'flex', alignItems:'center', gap:1.25, py:1, cursor:'pointer', borderBottom:'1px solid #eef2f7' }}>
          <HomeOutlinedIcon sx={{ color:'#64748b' }} />
          <Box sx={{ flex:1 }}>
            <Typography fontWeight={700}>Meet at my door</Typography>
            <Typography sx={{ color:'#075F40', fontSize:12 }}>{deliveryInstructions || deliveryPhotos.length ? `${deliveryInstructions ? 'Instructions added' : ''}${deliveryInstructions && deliveryPhotos.length ? ' - ' : ''}${deliveryPhotos.length ? `${deliveryPhotos.length} photo${deliveryPhotos.length === 1 ? '' : 's'} selected` : ''}` : 'Add delivery instructions & photos'}</Typography>
          </Box>
          <ChevronRightIcon sx={{ color:'#94a3b8' }} />
        </Box>
        <Box role={!contactEditing ? 'button' : undefined} tabIndex={!contactEditing ? 0 : undefined} onClick={!contactEditing ? editContactNumber : undefined} onKeyDown={!contactEditing ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); editContactNumber(); } } : undefined} sx={{ display:'flex', alignItems:'center', gap:1.25, py:1, cursor:contactEditing ? 'default' : 'pointer' }}>
          <PhoneOutlinedIcon sx={{ color:'#64748b' }} />
          <Box sx={{ flex:1, minWidth:0 }}>
            <Typography fontWeight={700}>Contact Number</Typography>
            {contactEditing ? <Box sx={{ display:'flex', alignItems:'flex-start', gap:1, mt:.75, flexWrap:{ xs:'wrap', sm:'nowrap' } }}>
              <TextField autoFocus size="small" fullWidth label="Mobile number" value={contactDraft} onChange={(event) => { setContactDraft(event.target.value); setContactError(''); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); saveContactNumber(); } if (event.key === 'Escape') { setContactEditing(false); setContactError(''); } }} error={Boolean(contactError)} helperText={contactError || 'Enter a 10-digit Indian mobile number'} inputProps={{ inputMode:'tel', maxLength:16 }} />
              <Button variant="contained" onClick={(event) => { event.stopPropagation(); saveContactNumber(); }}>Save</Button>
              <Button onClick={(event) => { event.stopPropagation(); setContactEditing(false); setContactError(''); }}>Cancel</Button>
            </Box> : <Typography sx={{ color:'#475569', fontSize:14 }}>{contactPhone || 'Add contact number'}</Typography>}
          </Box>
          {!contactEditing && <ChevronRightIcon sx={{ color:'#94a3b8' }} />}
        </Box>
      </Box>}
      <Dialog open={addressPickerOpen} onClose={() => setAddressPickerOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Select delivery address</DialogTitle>
        <DialogContent sx={{ display:'grid', gap:1.25, pt:'8px !important' }}>
          <Typography sx={{ color:'#64748b', fontSize:13 }}>Choose a saved address for this order.</Typography>
          {selectableAddresses.all.map((address) => (
            <Button key={address.id} fullWidth variant={address.id === selectedAddressId ? 'contained' : 'outlined'} onClick={() => chooseSavedAddress(address)} sx={{ justifyContent:'flex-start', alignItems:'flex-start', gap:1, textAlign:'left', textTransform:'none', py:1.25, color: address.id === selectedAddressId ? '#fff' : '#17233b' }}>
              <LocationOnOutlinedIcon fontSize="small" />
              <Box sx={{ display:'grid', minWidth:0 }}>
                <strong>{address.type || (address.fromOrder ? 'Previously used' : 'Saved address')}</strong>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{address.address}</span>
              </Box>
            </Button>
          ))}
          {selectableAddresses.saved.map((address) => <Button key={`edit:${address.id}`} onClick={() => navigate('/address-form', { state: { editAddress: address, returnTo: '/checkout' } })}>Edit {address.type || 'saved address'}</Button>)}
          <Button variant="text" onClick={() => { setAddressPickerOpen(false); navigate('/address-form', { state: { returnTo: '/checkout', location: selectedLocation } }); }} sx={{ justifyContent:'flex-start', textTransform:'none', color:'#075F40' }}>
            + Add a new address
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={deliveryInstructionsOpen} onClose={() => setDeliveryInstructionsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Delivery instructions</DialogTitle>
        <DialogContent sx={{ display:'grid', gap:2, pt:'12px !important' }}>
          <TextField label="Instructions for delivery partner" placeholder="For example: call on arrival or leave at the front door" multiline minRows={3} value={deliveryInstructions} onChange={(event) => setDeliveryInstructions(event.target.value)} />
          <Button component="label" variant="outlined">
            Add photos
            <input hidden type="file" accept="image/*" multiple onChange={(event) => setDeliveryPhotos(Array.from(event.target.files || []))} />
          </Button>
          {deliveryPhotos.length > 0 && <Typography color="text.secondary" variant="body2">{deliveryPhotos.length} photo{deliveryPhotos.length === 1 ? '' : 's'} selected</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryInstructionsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDeliveryInstructionsOpen(false)}>Save</Button>
        </DialogActions>
      </Dialog>
      <Box component="section" aria-label="Order Split Preview" sx={{ bgcolor:'white', p:{ xs:1.5, sm:2 }, display:'grid', gap:1.5 }}>
        <Typography fontWeight={700}>{activeMethod === 'pickup' ? 'Pick-up Summary' : 'Order Split Preview'}</Typography>
        {activeMethod === 'pickup' ? <Typography>Pick-up from {resolvedPickupStore} | {cartItems.length} items</Typography> : deliveryGroups.length ? deliveryGroups.map((group,index) => <Box key={group.key} sx={{ py:1, borderBottom:'1px solid #dce5e1', display:'flex', alignItems:'center', justifyContent:'space-between', gap:2, flexWrap:'wrap' }}>
          <Box sx={{ minWidth:0 }}><Typography fontWeight={700}>Order {index+1}: {group.line.storeName || 'Store not mapped'} | {group.lines.length} item{group.lines.length === 1 ? '' : 's'}</Typography><Typography variant="body2">{group.line.deliveryLabel} | {formatCurrency(totalDeliveryCharge(group.lines))}</Typography></Box>
          {group.line.fulfillmentType === 'global' ? <Typography>Delivered in 5-7 days</Typography> : <Box role="group" aria-label={`${group.line.storeName} fulfillment`} sx={{ display:'flex', gap:1 }}>
            <Button variant={group.line.deliveryType !== 'pickup' ? 'contained' : 'outlined'} onClick={() => setStoreMethods(current => ({ ...current, [group.line.storeId]:'standard' }))}>Delivery</Button>
            <Button disabled={checkoutStores.find(store => store.id === group.line.storeId)?.pickup === 'No'} variant={group.line.deliveryType === 'pickup' ? 'contained' : 'outlined'} onClick={() => setStoreMethods(current => ({ ...current, [group.line.storeId]:'pickup' }))}>Pick-up</Button>
          </Box>}
        </Box>) : <Typography color={quoteError ? 'error' : 'text.secondary'}>{quoteError || 'Calculating delivery for each item...'}</Typography>}
        <Typography fontWeight={700}>Delivery Charge: {formatCurrency(deliveryFee)}</Typography>
      </Box>
      <Box sx={{ bgcolor: 'white', p: { xs: 1.5, sm: 2 }, borderRadius: 3, display: 'grid', gap: 1.5, minWidth: 0, overflow: 'hidden' }}>
        {activeMethod !== 'pickup' && <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:1 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}><AccessTimeOutlinedIcon sx={{ color:'#64748b' }} /><Typography fontWeight={700}>Delivery time</Typography></Box>
          <Typography sx={{ color:'#64748b', fontSize:13 }}>{quoteLoading ? 'Calculating...' : deliveryWindow}</Typography>
        </Box>}
        {activeMethod !== 'pickup' && <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', sm:'repeat(3, minmax(0, 1fr))' }, gap:1, width:'100%', overflow:'hidden' }}>
          {availableMethods.slice(0, 3).map((item) => <Button key={`${item.id}:${item.label}`} variant={activeMethod === item.id ? 'contained' : 'outlined'} onClick={() => { setMethodChangedByUser(true); setMethod(item.id); if (item.id === 'scheduled') { if (!date) setDate(scheduleDates[0]?.value || new Date().toISOString().slice(0, 10)); if (!slot) setSlot(scheduleSlots[0]); } setError(''); }} sx={{ minHeight:70, minWidth:0, px:.75, alignItems:'flex-start', justifyContent:'center', flexDirection:'column', lineHeight:1.2, fontSize:11, overflow:'hidden' }}>
            <span>{item.id === 'instant' ? 'Priority' : item.id === 'scheduled' ? 'Schedule' : item.label.replace(' Delivery','')}</span>
            <small style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{item.caption || (item.id === 'scheduled' ? 'Earliest 6:3x' : deliveryWindow)}</small>
          </Button>)}
        </Box>}
        {activeMethod === 'pickup' && <><Typography fontWeight={700}>Pick-up options</Typography><Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1 }}><Button variant={pickupOption === 'standard' ? 'contained' : 'outlined'} onClick={() => { setPickupOption('standard'); setDate(''); setSlot(''); setError(''); }}>Standard<br />15-25 min</Button><Button variant={pickupOption === 'schedule' ? 'contained' : 'outlined'} onClick={() => { setPickupOption('schedule'); if (!date) setDate(scheduleDates[0]?.value || new Date().toISOString().slice(0, 10)); if (!slot) setSlot(scheduleSlots[0]); setError(''); }}>Schedule</Button></Box></>}
        {activeMethod !== 'pickup' && <Typography color={isGlobalReview ? 'warning.main' : quoteError ? 'error' : 'text.secondary'} sx={{ fontSize:13 }}>{quoteLoading ? 'Calculating delivery...' : isGlobalReview ? 'Global store products will be delivered in 5-7 days.' : quoteError || `${quote?.distanceKm ?? '--'} KM from ${selectedStore?.name || 'store'}${quote?.freeDeliveryApplied ? ' - free delivery applied' : ''}`}</Typography>}
        {(activeMethod === 'scheduled' || isScheduledPickup) && (
          <Box sx={{ display:'grid', gap:1.25, p:{ xs:1.25, sm:1.75 }, border:'1px solid #e2e8f0', borderRadius:2, bgcolor:'#fff' }}>
            <Typography fontWeight={800}>{isScheduledPickup ? 'Schedule pickup' : 'Schedule delivery'}</Typography>
            <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', sm:'auto repeat(3, minmax(0, 1fr)) auto' }, gap:1, alignItems:'stretch' }}>
              <Button aria-label="Show previous schedule dates" disabled={scheduleDateOffset === 0} onClick={() => { setScheduleDateOffset((offset) => Math.max(0, offset - 1)); setDate(''); setSlot(''); }}><ChevronLeftIcon /></Button>
              {scheduleDates.map((item) => (
                <Button key={item.value} variant="outlined" onClick={() => { setDate(item.value); if (!slot) setSlot(scheduleSlots[0]); setError(''); }} sx={{ justifyContent:'flex-start', alignItems:'flex-start', flexDirection:'column', minHeight:58, borderColor: date === item.value ? '#111827' : '#e5e7eb', color:'#111827', bgcolor:'#fff', borderRadius:1.5, textTransform:'none', '&:hover':{ borderColor:'#111827', bgcolor:'#fff' } }}>
                  <span style={{ fontWeight:800 }}>{item.title}</span>
                  <small>{item.subtitle}</small>
                </Button>
              ))}
              <Button aria-label="Show next schedule dates" onClick={showNextScheduleDates} sx={{ minWidth:{ xs:'100%', sm:44 }, px:1, color:'#111827', border:'1px solid #e5e7eb', borderRadius:1.5, bgcolor:'#fff', '&:hover':{ borderColor:'#111827', bgcolor:'#fff' } }}>
                <ChevronRightIcon />
              </Button>
            </Box>
            <Box sx={{ display:'grid' }}>
              {scheduleSlots.map((item) => (
                <Box key={item} role="button" tabIndex={0} onClick={() => { setSlot(item); setError(''); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSlot(item); setError(''); } }} sx={{ display:'flex', alignItems:'center', gap:1.25, py:1.1, borderBottom:'1px solid #f1f5f9', cursor:'pointer' }}>
                  <Box component="span" sx={{ width:13, height:13, borderRadius:'50%', border:'1.5px solid #111827', display:'inline-flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto' }}>
                    {selectedScheduleSlot === item && <Box component="span" sx={{ width:7, height:7, borderRadius:'50%', bgcolor:'#111827' }} />}
                  </Box>
                  <Typography sx={{ fontSize:14, color:'#111827' }}>{item}</Typography>
                </Box>
              ))}
            </Box>
            <Typography sx={{ textAlign:'center', fontSize:13, fontWeight:700 }}>{scheduleSummary}</Typography>
            <Button variant="contained" onClick={chooseScheduledMethod} sx={{ bgcolor:'#050505', color:'#fff', borderRadius:1.5, py:1.2, '&:hover':{ bgcolor:'#111827' } }}>Schedule</Button>
            <Button onClick={() => { if (isScheduledPickup) { setPickupOption('standard'); } else { setMethod('standard'); setMethodChangedByUser(false); } setDate(''); setSlot(''); setError(''); }} sx={{ bgcolor:'#f3f4f6', color:'#111827', borderRadius:1.5, py:1.2, '&:hover':{ bgcolor:'#e5e7eb' } }}>Cancel</Button>
          </Box>
        )}
        {activeMethod === 'pickup' && <Box sx={{ p: 1.5, border:'1px solid #e2e8f0', borderRadius:1.5, bgcolor:'#f8fafc' }}><Typography sx={{ fontSize:12, color:'#64748b' }}>Pickup store</Typography><Typography fontWeight={800}>{resolvedPickupStore || 'Selected store'}</Typography>{selectedStore?.address || selectedStore?.location ? <Typography sx={{ color:'#64748b', fontSize:13 }}>{selectedStore?.address || selectedStore?.location}</Typography> : null}</Box>}
        <TextField label="Order notes" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' } }}><TextField fullWidth label="Coupon code" value={coupon} onChange={(event) => { setCoupon(event.target.value.toUpperCase()); setAppliedCoupon(null); setCouponMessage(''); }} helperText={couponMessage || 'Use SAVE10 or an admin-created coupon.'} error={Boolean(couponMessage && !appliedCoupon)} color={appliedCoupon ? 'success' : 'primary'} /><Button variant="outlined" onClick={applyCoupon} sx={{ minHeight: 56 }}>{appliedCoupon ? 'Applied' : 'Apply'}</Button></Box>
      </Box>
      <Box sx={{ bgcolor:'white', p:{ xs:1.5, sm:2 }, borderRadius:3, display:'grid', gap:1, minWidth:0, overflow:'hidden' }}>
        <Typography fontWeight={800}>Order summary</Typography>
        <Button aria-expanded={summaryOpen} onClick={() => setSummaryOpen((open) => !open)} sx={{ display:'flex', justifyContent:'space-between', textAlign:'left', textTransform:'none' }}><Typography>{deliveryGroups.length > 1 ? `${deliveryGroups.length} delivery groups` : deliveryGroups[0]?.line.storeName || selectedStore?.name || resolvedPickupStore || 'Store'}<br/><small>{cartItems.length} Item{cartItems.length===1?'':'s'}</small></Typography><ChevronRightIcon sx={{ color:'#94a3b8', transform:summaryOpen ? 'rotate(90deg)' : undefined }} /></Button>
        {deliveryGroups.length > 1 && deliveryGroups.map((group) => <Box key={group.key} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1 }}><Typography>{group.line.storeName || 'Store not mapped'}<br/><small>{group.line.deliveryLabel} | {group.lines.length} item{group.lines.length === 1 ? '' : 's'}</small></Typography><Typography>{formatCurrency(totalDeliveryCharge(group.lines))}</Typography></Box>)}
        {summaryOpen && cartItems.map((item) => <Box key={`${item.storeId}:${item.productId}:${item.variantId}`} sx={{ display:'flex', justifyContent:'space-between', gap:2 }}><Typography>{item.title} x {item.quantity}</Typography><Typography>{formatCurrency(Number(item.price) * item.quantity)}</Typography></Box>)}
        {appliedCoupon && <Box sx={{ display:'flex', alignItems:'center', gap:1, bgcolor:'#a3e635', color:'#17392c', p:1, borderRadius:1 }}><LocalOfferOutlinedIcon fontSize="small" /><Typography sx={{ fontSize:13 }}>Saving {formatCurrency(discount)} with promotions</Typography></Box>}
      </Box>
      <Box sx={{ bgcolor: 'white', p: { xs: 1.5, sm: 2 }, borderRadius: 3, minWidth: 0, overflow: 'hidden' }}><Typography fontWeight={700}>Invoice Summary</Typography><Typography>Subtotal: {formatCurrency(subtotal)}</Typography><Typography>Discount: -{formatCurrency(discount)}</Typography><Typography>Delivery: {formatCurrency(deliveryFee)}</Typography><Typography>Handling: {formatCurrency(cartItems.length ? 5 : 0)}</Typography><Typography variant="h6">Total: {formatCurrency(total)}</Typography></Box>
      {error && <Typography role="alert" color="error">{error}</Typography>}
      <Button variant="contained" onClick={proceed} sx={{ bgcolor:'#050505', color:'white', py:1.5, borderRadius:2, '&:hover':{ bgcolor:'#111827' } }}>{activeMethod === 'pickup' ? 'Place order' : 'Next'}</Button>
    </Box></Box>
  </Box>;
};

export default CheckoutPage;
