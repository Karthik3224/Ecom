import { useContext, useMemo, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogContent, Divider, IconButton, Typography } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { AppContext } from '../../context/AppContext';
import GoogleLocationPicker from '../GoogleLocationPicker/GoogleLocationPicker';

import './LocationSelectionModal.css';

const cleanText = (value) => String(value || '').split(',').map((part) => part.trim()).filter((part) => part && !/^(undefined|null)$/i.test(part)).join(', ').replace(/\s+/g, ' ').trim();

export default function LocationSelectionModal() {
  const { showLocationModal, setShowLocationModal, saveSelectedLocation, isLoggedIn, addresses, orderAddresses, selectedLocation } = useContext(AppContext);
  const [selected, setSelected] = useState(selectedLocation || null);
  const [error, setError] = useState('');

  const savedOptions = useMemo(() => {
    const seen = new Set();
    return [...(addresses || []), ...(orderAddresses || [])].reduce((list, entry) => {
      const address = cleanText(entry.address);
      const latitude = Number(entry.coordinates?.lat ?? entry.latitude);
      const longitude = Number(entry.coordinates?.lng ?? entry.longitude);
      const key = address.toLowerCase();
      if (!key || seen.has(key) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return list;
      seen.add(key);
      list.push({ ...entry, title: entry.type || 'Saved address', address, latitude, longitude, coordinates: { lat: latitude, lng: longitude }, source: 'manual' });
      return list;
    }, []).slice(0, 5);
  }, [addresses, orderAddresses]);

  const close = () => { sessionStorage.removeItem('locationPickerManualOpen'); setSelected(selectedLocation || null); setError(''); setShowLocationModal(false); };
  const save = (place) => {
    try {
      sessionStorage.removeItem('locationPickerManualOpen');
      saveSelectedLocation({ ...place, address: cleanText(place.address || place.subtitle), city: cleanText(place.city), title: cleanText(place.title), pincode: cleanText(place.pincode) });
    } catch (reason) { setError(reason.message || 'Your browser could not save this location.'); }
  };



  return <Dialog open={showLocationModal} onClose={close} aria-labelledby="choose-location-title" className="choose-location-dialog" fullWidth maxWidth="md">
    <DialogContent>
      <IconButton className="choose-location-close" aria-label="Close location popup" onClick={close}><CloseIcon /></IconButton>
      <Box className="choose-location-icon"><LocationOnOutlinedIcon /></Box>
      <Typography id="choose-location-title" component="h2">Select delivery location</Typography>
      <Typography id="choose-location-description">Search, use GPS, or move the map pin to choose your delivery address.</Typography>
      {error && <Alert severity="warning" sx={{ my: 1 }}>{error}</Alert>}
      {isLoggedIn && savedOptions.length > 0 && <Box className="choose-location-saved" role="group" aria-label="Your saved addresses"><Typography component="h3">Deliver to a saved address</Typography><Box className="choose-location-saved-list">{savedOptions.map((entry) => <Button key={entry.id} fullWidth variant="outlined" onClick={() => setSelected(entry)}>{entry.fromOrder ? <HistoryOutlinedIcon fontSize="small" /> : <LocationOnOutlinedIcon fontSize="small" />}<span className="choose-location-saved-text"><strong>{entry.type || 'Previously used'}</strong><span>{entry.address}</span></span></Button>)}</Box><Divider>OR</Divider></Box>}
      <GoogleLocationPicker value={selected} onChange={setSelected} onConfirm={save} confirmLabel="Confirm Location" />
    </DialogContent>
  </Dialog>;
}



