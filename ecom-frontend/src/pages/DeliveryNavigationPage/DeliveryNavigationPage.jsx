import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import NavigationIcon from '@mui/icons-material/Navigation';
import RouteIcon from '@mui/icons-material/Route';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useLocation, useNavigate } from 'react-router-dom';
import { geocodeOpenStreetMap, openStreetMapDirectionsUrl, openStreetMapEmbedUrl } from '../../services/openStreetMapService';
import logo from '../../assets/images/logo.png';
import './DeliveryNavigationPage.css';

const fallback = { lat:17.4401, lng:78.3489, label:'Gachibowli, Hyderabad, Telangana' };
const distanceKm = (a, b) => {
  const rad = (value) => value * Math.PI / 180;
  const dLat = rad(b.lat-a.lat); const dLng = rad(b.lng-a.lng);
  const value = Math.sin(dLat/2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng/2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1-value));
};

const DeliveryNavigationPage = () => {
  const navigate = useNavigate();
  const order = useLocation().state?.order;
  const address = order?.shippingAddress?.addressLine1 || order?.addresses?.find(a=>a.addressType==='SHIPPING')?.addressLine1 || order?.checkout?.deliveryAddress || order?.deliveryAddress || order?.address || fallback.label;
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => setOrigin({ lat:coords.latitude,lng:coords.longitude }), () => setOrigin({ lat:17.385,lng:78.4867 }));
    geocodeOpenStreetMap(address).then((result) => setDestination(result ? { lat:result.lat,lng:result.lng,label:result.address } : { ...fallback,label:address })).catch(() => setDestination({ ...fallback,label:address }));
  }, [address]);

  const distance = origin && destination ? distanceKm(origin,destination) : 0;
  const directions = origin && destination ? openStreetMapDirectionsUrl({ origin:`${origin.lat},${origin.lng}`, destination:`${destination.lat},${destination.lng}` }) : '#';
  const embedUrl = destination ? openStreetMapEmbedUrl(destination) : '';
  const estimate = useMemo(() => distance ? Math.max(5,Math.ceil(distance / 25 * 60)) : 0,[distance]);

  return <Box className="nav-shell"><Box className="nav-header"><Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/delivery')}>Back</Button><Box><img src={logo} alt="Spices and Pickles" /><Box><Typography fontWeight={800}>Delivery Navigation</Typography><Typography variant="caption">Powered by OpenStreetMap</Typography></Box></Box><Button startIcon={<NavigationIcon />} disabled={!destination} onClick={() => window.open(directions,'_blank','noopener,noreferrer')}>Start Navigation</Button></Box><Box className="nav-layout"><Box className="nav-map-card">{embedUrl ? <Box className="nav-map"><iframe title="OpenStreetMap delivery area" src={embedUrl} referrerPolicy="no-referrer-when-downgrade" /></Box> : <Box className="nav-loading"><NavigationIcon sx={{fontSize:52,color:'#075f40'}} /><Typography>Preparing route...</Typography></Box>}</Box><Box className="nav-details"><Typography variant="h5">Route overview</Typography><Box className="nav-stat-grid"><Box><RouteIcon /><span><strong>{distance ? distance.toFixed(1) : '-'} km</strong><small>Approximate distance</small></span></Box><Box><AccessTimeIcon /><span><strong>{estimate || '-'} min</strong><small>Estimated time</small></span></Box></Box><Box className="nav-stop"><MyLocationIcon /><span><small>Current location</small><strong>{origin ? `${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}` : 'Finding GPS...'}</strong></span></Box><Box className="nav-route-line"/><Box className="nav-stop destination"><NavigationIcon /><span><small>Delivery destination</small><strong>{destination?.label || address}</strong></span></Box>{order && <Box className="nav-order"><Typography fontWeight={800}>{order.id}</Typography><Typography>{order.items?.map((item) => `${item.title} x ${item.quantity}`).join(', ')}</Typography><Typography color="text.secondary">Customer delivery address: {address}</Typography></Box>}<Button fullWidth variant="contained" startIcon={<NavigationIcon />} disabled={!destination} onClick={() => window.open(directions,'_blank','noopener,noreferrer')}>Open full navigation</Button><Typography className="nav-note">Distance and time shown here are estimates. OpenStreetMap provides the map and route link.</Typography></Box></Box></Box>;
};

export default DeliveryNavigationPage;
