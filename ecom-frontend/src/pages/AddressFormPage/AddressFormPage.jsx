import { useEffect, useState, useContext } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { reverseGeocodeOpenStreetMap } from '../../services/openStreetMapService';
import { indianMobileDigits } from '../../utils/phoneValidation';
import { validateAddressFields } from '../../utils/addressValidation';
import { addressFieldsFromLocation, fillMissingAddressFields } from '../../utils/addressPrefill';
import './AddressFormPage.css';

const normalizeLocation = (value) => value ? {
  ...value,
  coordinates: value.coordinates || (Number.isFinite(Number(value.latitude)) && Number.isFinite(Number(value.longitude)) ? { lat:Number(value.latitude), lng:Number(value.longitude) } : null),
} : null;
const cleanAddressPart = (value) => String(value || '').trim();
const joinAddressParts = (parts) => parts
  .map(cleanAddressPart)
  .filter((part) => part && !/^undefined$/i.test(part) && !/^null$/i.test(part))
  .join(', ');

const AddressFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editAddress = location.state?.editAddress;
  const draft = location.state?.draft;
  const selectedLocation = location.state?.location;
  const { setDeliveryAddress, addAddress, updateAddress, user } = useContext(AppContext);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [locationSummary, setLocationSummary] = useState(normalizeLocation(selectedLocation));
  const [isLocating, setIsLocating] = useState(!location.state?.startManual && !selectedLocation && !editAddress);
  const [manualMode, setManualMode] = useState(Boolean(location.state?.startManual || (!selectedLocation && editAddress?.manualLocation)));
  const [manualLocation, setManualLocation] = useState(selectedLocation ? addressFieldsFromLocation(selectedLocation) : draft?.manualLocation || editAddress?.manualLocation || addressFieldsFromLocation({}));

  const [houseNumber, setHouseNumber] = useState(draft?.houseNumber || editAddress?.houseNumber || selectedLocation?.houseNumber || '');
  const [floor, setFloor] = useState(draft?.floor || editAddress?.floor || '');
  const [landmark, setLandmark] = useState(draft?.landmark || editAddress?.landmark || '');
  const [saveAs, setSaveAs] = useState(draft?.type || editAddress?.type || 'Home');
  const [phone, setPhone] = useState(draft?.phone || editAddress?.phone || user?.phone?.replace(/\D/g, '').slice(-10) || '');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const useGps = () => navigate('/address-map', {
    state: {
      returnTo: '/address-form',
      location: locationSummary || (editAddress?.coordinates ? normalizeLocation({ ...editAddress, title: editAddress.type, subtitle: editAddress.address }) : null),
      formState: { ...location.state, startManual: manualMode, draft: { houseNumber, floor, landmark, type: saveAs, phone, manualLocation } },
    },
  });

  useEffect(() => {
    const coordinates = selectedLocation?.coordinates || (selectedLocation ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude } : null);
    if (!coordinates || coordinates.lat == null || coordinates.lng == null) return;
    let cancelled = false;
    reverseGeocodeOpenStreetMap(coordinates.lat, coordinates.lng).then((data) => {
      if (cancelled || !data) return;
      setManualLocation((current) => fillMissingAddressFields(current, data));
      setHouseNumber((current) => current || data.houseNumber || '');
      setLocationSummary((current) => normalizeLocation({ ...current, ...data, coordinates }));
    }).catch(() => { /* Selected location remains usable when lookup is unavailable. */ });
    return () => { cancelled = true; };
  }, [selectedLocation, editAddress]);

  useEffect(() => {
    if (location.state?.startManual || selectedLocation || editAddress) return;
    if (!navigator.geolocation) {
      const timer = setTimeout(() => { setIsLocating(false); setFormError('Location access is not supported. Search the location manually.'); }, 0);
      return () => clearTimeout(timer);
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const coordinates = { lat:position.coords.latitude,lng:position.coords.longitude };
      try {
        const data = await reverseGeocodeOpenStreetMap(coordinates.lat, coordinates.lng);
        setManualLocation((current) => fillMissingAddressFields(current, data || {}));
        setHouseNumber((current) => current || data?.houseNumber || '');
        setLocationSummary(normalizeLocation({ ...data, title:data?.title || 'Current Location',subtitle:data?.subtitle || `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,coordinates }));
      } catch {
        setLocationSummary(normalizeLocation({ title:'Current Location',subtitle:`${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,coordinates }));
      } finally { setIsLocating(false); }
    }, (error) => { setIsLocating(false); setFormError(`${error.message}. Search the location manually.`); }, { enableHighAccuracy:true,timeout:10000 });
  }, [editAddress, selectedLocation, location.state?.startManual]);

  const handleSaveAddress = async () => {
    if (isLocating) return;
    const errors = validateAddressFields({ houseNumber, floor, landmark, phone, manualMode, manualLocation });
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setFormError('');
      document.getElementById(`address-${Object.keys(errors)[0]}`)?.focus();
      return;
    }
    if (!manualMode && !locationSummary && !editAddress) { setFormError('Wait for the live location or enter the address manually.'); return; }
    const baseLocation = manualMode ? joinAddressParts([manualLocation.street, manualLocation.city, manualLocation.state, manualLocation.pincode]) : locationSummary ? joinAddressParts([locationSummary.title, locationSummary.subtitle || locationSummary.address]) : editAddress.address;
    const formatted = joinAddressParts([saveAs, houseNumber, `Floor ${floor}`, landmark, baseLocation]);
    const detectedManualLocation = locationSummary ? {
      street: locationSummary.address || locationSummary.subtitle || locationSummary.title || '',
      city: locationSummary.city || '',
      state: locationSummary.state || '',
      pincode: locationSummary.pincode || '',
    } : null;
    const addressData = { type: saveAs, address: formatted, phone:indianMobileDigits(phone), houseNumber, floor, landmark, coordinates: manualMode ? null : (locationSummary?.coordinates || editAddress?.coordinates || null), manualLocation: manualMode ? manualLocation : detectedManualLocation };
    try {
      const saved = editAddress?.id ? await updateAddress(editAddress.id, addressData) : await addAddress(addressData);
      setDeliveryAddress(saved.address || formatted);
    } catch (error) {
      setNeedsSignIn(error.status === 401);
      setFormError(error.message || 'Could not save the address.');
      return;
    }
    setFormError('');
    setShowSuccessModal(true);

    setTimeout(() => {
      setShowSuccessModal(false);
      navigate(location.state?.returnTo || (editAddress ? '/saved-addresses' : '/cart'));
    }, 1800);
  };

  return (
    <Box className="form-page-wrapper">
      {/* Top Header Bar */}
      <Box className="form-page-header">
        <IconButton onClick={() => navigate(-1)} style={{ color: '#ffffff' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" className="form-header-title">
          {editAddress ? 'Edit Address' : 'Address Details'}
        </Typography>
      </Box>

      {/* Main Scroll Content */}
      <Box className="form-page-scroll">
        {/* Top Location Summary Card */}
        <Box className="loc-summary-card">
          <Box className="loc-card-left">
            <Typography className="loc-main-name">{isLocating ? 'Detecting your live location…' : `Location: ${locationSummary?.title || editAddress?.type || 'Select location'}`}</Typography>
            <Typography className="loc-sub-name">{isLocating ? 'Please allow location access in your browser.' : locationSummary?.subtitle || editAddress?.address || 'Use Change to search manually.'}</Typography>
          </Box>
          <Button className="change-loc-btn" startIcon={<MyLocationIcon />} disabled={isLocating} onClick={useGps}>
            {isLocating ? 'Locating...' : 'Use GPS'}
          </Button>
        </Box>

        <Button variant="outlined" onClick={() => { setManualMode((value) => !value); setFormError(''); }} sx={{ alignSelf:'flex-start',mb:2,borderColor:'#075F40',color:'#075F40',textTransform:'none' }}>{manualMode ? 'Use detected location' : 'Enter address manually'}</Button>

        {/* Input Form Fields */}
        <Box className="address-form-box">
          {manualMode && [['street', 'Street / Road / Area'], ['city', 'City'], ['state', 'State'], ['pincode', 'PIN / Postal code']].map(([key, label]) => <Box key={key} className="form-field-group">
            <Typography component="label" htmlFor={`address-${key}`} className="form-field-label">{label} <span className="req">*</span></Typography>
            <input id={`address-${key}`} className="custom-form-input" value={manualLocation[key] || ''} inputMode={key === 'pincode' ? 'numeric' : 'text'} aria-invalid={Boolean(fieldErrors[key])} aria-describedby={fieldErrors[key] ? `error-${key}` : undefined} onChange={event => { const value = key === 'pincode' ? event.target.value.replace(/\D/g, '').slice(0, 6) : event.target.value; setManualLocation(current => ({ ...current, [key]: value })); setFieldErrors(current => ({ ...current, [key]: '' })); }} placeholder={`Enter ${label.toLowerCase()}`} />
            {fieldErrors[key] && <Typography id={`error-${key}`} role="alert" color="error" variant="caption">{fieldErrors[key]}</Typography>}
          </Box>)}
          <Box className="form-field-group">
            <Typography className="form-field-label">
              House number /Name /Area <span className="req">*</span>
            </Typography>
            <input
              id="address-houseNumber"
              aria-label="House number, building name or area"
              aria-invalid={Boolean(fieldErrors.houseNumber)}
              aria-describedby={fieldErrors.houseNumber ? 'error-houseNumber' : undefined}
              type="text"
              placeholder="Enter your House number /name/area"
              value={houseNumber}
              onChange={(e) => { setHouseNumber(e.target.value); setFieldErrors(current => ({ ...current, houseNumber: '' })); }}
              className="custom-form-input"
            />
            {fieldErrors.houseNumber && <Typography id="error-houseNumber" role="alert" color="error" variant="caption">{fieldErrors.houseNumber}</Typography>}
          </Box>

          <Box className="form-field-group">
            <Typography className="form-field-label">
              Floor <span className="req">*</span>
            </Typography>
            <input
              type="text"
              placeholder="Enter your floor"
              id="address-floor"
              aria-label="Floor"
              aria-invalid={Boolean(fieldErrors.floor)}
              aria-describedby={fieldErrors.floor ? 'error-floor' : undefined}
              value={floor}
              onChange={(e) => { setFloor(e.target.value); setFieldErrors(current => ({ ...current, floor: '' })); }}
              className="custom-form-input"
            />
            {fieldErrors.floor && <Typography id="error-floor" role="alert" color="error" variant="caption">{fieldErrors.floor}</Typography>}
          </Box>

          <Box className="form-field-group">
            <Typography className="form-field-label">
              Landmark <span className="req">*</span>
            </Typography>
            <input
              type="text"
              placeholder="Enter your landmark"
              id="address-landmark"
              aria-label="Landmark"
              aria-invalid={Boolean(fieldErrors.landmark)}
              aria-describedby={fieldErrors.landmark ? 'error-landmark' : undefined}
              value={landmark}
              onChange={(e) => { setLandmark(e.target.value); setFieldErrors(current => ({ ...current, landmark: '' })); }}
              className="custom-form-input"
            />
            {fieldErrors.landmark && <Typography id="error-landmark" role="alert" color="error" variant="caption">{fieldErrors.landmark}</Typography>}
          </Box>

          {/* Save as Chips */}
          <Box className="form-field-group">
            <Typography className="form-field-label">
              Save as <span className="req">*</span>
            </Typography>
            <Box className="save-as-chips-row">
              {[
                { label: 'Home' },
                { label: 'Office' },
                { label: 'Other' },
              ].map((item) => (
                <Button
                  key={item.label}
                  className={`save-chip ${saveAs === item.label ? 'active' : ''}`}
                  onClick={() => setSaveAs(item.label)}
                >
                  <span className="chip-icon" aria-hidden="true">{item.label === 'Home' ? <HomeOutlinedIcon fontSize="small" /> : item.label === 'Office' ? <BusinessOutlinedIcon fontSize="small" /> : <LocationOnOutlinedIcon fontSize="small" />}</span> {item.label}
                </Button>
              ))}
            </Box>
          </Box>

          <Box className="form-field-group">
            <Typography className="form-field-label">
              Receiver's Phone Number <span className="req">*</span>
            </Typography>
            <input
              type="text"
              placeholder="9988890909"
              id="address-phone"
              aria-label="Receiver's Phone Number"
              inputMode="tel"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'error-phone' : undefined}
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setFieldErrors(current => ({ ...current, phone: '' })); }}
              className="custom-form-input"
            />
            {fieldErrors.phone && <Typography id="error-phone" role="alert" color="error" variant="caption">{fieldErrors.phone}</Typography>}
          </Box>
        </Box>
      </Box>

      {/* Bottom Sticky Save Button */}
      <Box className="form-sticky-footer">
        {formError && <Typography role="alert" sx={{ color: '#b91c1c', mb: 1 }}>{formError}</Typography>}
        {needsSignIn && <Button onClick={() => navigate('/login', { state: { from: '/address-form', returnState: { ...location.state, location: locationSummary, startManual: manualMode, draft: { houseNumber, floor, landmark, type: saveAs, phone, manualLocation } } } })}>Sign in again</Button>}
        <Button
          variant="contained"
          fullWidth
          className="save-address-btn"
          onClick={handleSaveAddress}
        >
          Save Address Details
        </Button>
      </Box>

      {/* Success Modal (Matching address successful screenshot) */}
      {showSuccessModal && (
        <Box className="modal-overlay-backdrop">
          <Box className="success-modal-card">
            <Box className="green-circle-icon-wrap">
              <CheckCircleIcon className="success-check-icon" />
            </Box>
            <Typography className="success-modal-text">
              Address updated successfully
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AddressFormPage;
