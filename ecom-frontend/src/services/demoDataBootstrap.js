const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const upsertById = (key, records) => {
  const current = read(key, []);
  const byId = new Map(current.map((item) => [item.id, item]));
  records.forEach((item) => byId.set(item.id, { ...byId.get(item.id), ...item }));
  write(key, Array.from(byId.values()));
};

const now = new Date().toISOString();
const deliveryModes = 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery,Store Pickup';

const locations = [
  { id:'loc-hyd', name:'Hyderabad', code:'HYD', city:'Hyderabad', state:'Telangana', country:'India', pincode:'500081', address:'Madhapur, Hyderabad, Telangana', phone:'+91 90000 10001', email:'hyd@metaarch.local', admin:'locationadmin', status:'Active', active:true, createdAt:now },
  { id:'loc-blr', name:'Bengaluru', code:'BLR', city:'Bengaluru', state:'Karnataka', country:'India', pincode:'560034', address:'Koramangala, Bengaluru, Karnataka', phone:'+91 90000 10002', email:'blr@metaarch.local', admin:'locationadminblr', status:'Active', active:true, createdAt:now },
  { id:'loc-chn', name:'Chennai', code:'CHN', city:'Chennai', state:'Tamil Nadu', country:'India', pincode:'600017', address:'T Nagar, Chennai, Tamil Nadu', phone:'+91 90000 10003', email:'chn@metaarch.local', admin:'locationadminchn', status:'Active', active:true, createdAt:now },
  { id:'loc-vja', name:'Vijayawada', code:'VJA', city:'Vijayawada', state:'Andhra Pradesh', country:'India', pincode:'520010', address:'Benz Circle, Vijayawada, Andhra Pradesh', phone:'+91 90000 10004', email:'vja@metaarch.local', admin:'locationadminvja', status:'Active', active:true, createdAt:now },
];

const stores = [
  { id:'india-store-1-1', name:'Hyderabad Main Store', location:'Hyderabad', state:'Telangana', address:'Madhapur Main Road, Hyderabad, Telangana 500081, India', latitude:17.4482948, longitude:78.3914850, provider:'OPENSTREETMAP', locationAccuracyMeters:25, phone:'+91 91000 20000', email:'hyderabad-main@metaarch.local', admin:'Ramesh HYD Main', openingTime:'08:00', closingTime:'22:00', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/grocery,food,store?lock=900', status:'Active', active:true, createdAt:now },
  { id:'india-store-1-3', name:'SR Nagar Store', location:'Hyderabad', state:'Telangana', address:'Home, 4-1-209, Floor 2, SR Nagar Main Road, Srinivas Nagar, SR Nagar, Ameerpet, Hyderabad, Telangana 500038, India', latitude:17.4419210, longitude:78.4482870, provider:'OPENSTREETMAP', locationAccuracyMeters:25, phone:'+91 91000 20013', email:'srnagar@metaarch.local', admin:'Vikram SR Nagar', openingTime:'08:00', closingTime:'22:00', delivery:'Yes', pickup:'Yes', isNew:false, image:'https://loremflickr.com/900/600/grocery,store,hyderabad?lock=913', status:'Active', active:true, createdAt:now },
  { id:'store-gachibowli', name:'Gachibowli Fresh Hub', location:'Hyderabad', state:'Telangana', address:'DLF Road, Gachibowli, Hyderabad, Telangana 500032, India', latitude:17.4434778, longitude:78.3771953, provider:'OPENSTREETMAP', locationAccuracyMeters:20, phone:'+91 91000 20001', email:'gachibowli@metaarch.local', admin:'Sravani Gachibowli', openingTime:'08:00', closingTime:'22:00', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/grocery,store,food?lock=901', status:'Active', active:true, createdAt:now },
  { id:'store-banjara', name:'Banjara Hills Pickle House', location:'Hyderabad', state:'Telangana', address:'Road No. 12, Banjara Hills, Hyderabad, Telangana 500034, India', latitude:17.4138277, longitude:78.4397573, provider:'OPENSTREETMAP', locationAccuracyMeters:25, phone:'+91 91000 20002', email:'banjara@metaarch.local', admin:'Mahesh Banjara', openingTime:'09:00', closingTime:'21:30', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/indian,food,shop?lock=902', status:'Active', active:true, createdAt:now },
  { id:'store-secunderabad', name:'Secunderabad Daily Foods', location:'Hyderabad', state:'Telangana', address:'Sardar Patel Road, Secunderabad, Telangana 500003, India', latitude:17.4399295, longitude:78.4982741, provider:'OPENSTREETMAP', locationAccuracyMeters:30, phone:'+91 91000 20003', email:'secunderabad@metaarch.local', admin:'Anil Secunderabad', openingTime:'08:30', closingTime:'22:00', delivery:'Yes', pickup:'No', image:'https://loremflickr.com/900/600/vegetable,market?lock=903', status:'Active', active:true, createdAt:now },
  { id:'store-benzcircle', name:'Benz Circle Fresh Basket', location:'Vijayawada', state:'Andhra Pradesh', address:'Benz Circle, Vijayawada, Andhra Pradesh 520010, India', latitude:16.5061743, longitude:80.6480153, provider:'OPENSTREETMAP', locationAccuracyMeters:20, phone:'+91 91000 20007', email:'benzcircle@metaarch.local', admin:'Lakshmi Benz Circle', openingTime:'08:00', closingTime:'21:30', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/fresh,food?lock=907', status:'Active', active:true, createdAt:now },
  { id:'store-governorpet', name:'Governorpet Spice Store', location:'Vijayawada', state:'Andhra Pradesh', address:'Governorpet, Vijayawada, Andhra Pradesh 520002, India', latitude:16.5131048, longitude:80.6298704, provider:'OPENSTREETMAP', locationAccuracyMeters:30, phone:'+91 91000 20008', email:'governorpet@metaarch.local', admin:'Ravi Governorpet', openingTime:'08:30', closingTime:'22:00', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/spice,store?lock=908', status:'Active', active:true, createdAt:now },
  { id:'store-poranki', name:'Poranki Fresh Mart', location:'Vijayawada', state:'Andhra Pradesh', address:'Poranki, Vijayawada, Andhra Pradesh 521137, India', latitude:16.4749723, longitude:80.7125405, provider:'OPENSTREETMAP', locationAccuracyMeters:35, phone:'+91 91000 20009', email:'poranki@metaarch.local', admin:'Sneha Poranki', openingTime:'08:00', closingTime:'21:00', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/grocery,vegetables?lock=909', status:'Active', active:true, createdAt:now },
  { id:'store-tnagar', name:'T Nagar Family Foods', location:'Chennai', state:'Tamil Nadu', address:'Usman Road, T Nagar, Chennai, Tamil Nadu 600017, India', latitude:13.0418068, longitude:80.2341001, provider:'OPENSTREETMAP', locationAccuracyMeters:20, phone:'+91 91000 20006', email:'tnagar@metaarch.local', admin:'Arun T Nagar', openingTime:'08:00', closingTime:'21:00', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/food,market?lock=906', status:'Active', active:true, createdAt:now },
  { id:'store-adyar', name:'Adyar Organic Basket', location:'Chennai', state:'Tamil Nadu', address:'Lattice Bridge Road, Adyar, Chennai, Tamil Nadu 600020, India', latitude:13.0064500, longitude:80.2577799, provider:'OPENSTREETMAP', locationAccuracyMeters:25, phone:'+91 91000 20010', email:'adyar@metaarch.local', admin:'Divya Adyar', openingTime:'08:00', closingTime:'22:00', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/organic,food?lock=910', status:'Active', active:true, createdAt:now },
  { id:'store-velachery', name:'Velachery Daily Foods', location:'Chennai', state:'Tamil Nadu', address:'Velachery Main Road, Velachery, Chennai, Tamil Nadu 600042, India', latitude:12.9759710, longitude:80.2212092, provider:'OPENSTREETMAP', locationAccuracyMeters:30, phone:'+91 91000 20011', email:'velachery@metaarch.local', admin:'Karthik Velachery', openingTime:'08:30', closingTime:'22:00', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/supermarket,food?lock=911', status:'Active', active:true, createdAt:now },
  { id:'store-koramangala', name:'Koramangala Gourmet Mart', location:'Bengaluru', state:'Karnataka', address:'5th Block, Koramangala, Bengaluru, Karnataka 560095, India', latitude:12.9352403, longitude:77.6245320, provider:'OPENSTREETMAP', locationAccuracyMeters:20, phone:'+91 91000 20004', email:'koramangala@metaarch.local', admin:'Kiran Koramangala', openingTime:'08:00', closingTime:'22:00', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/supermarket,food?lock=904', status:'Active', active:true, createdAt:now },
  { id:'store-indiranagar', name:'Indiranagar Organic Foods', location:'Bengaluru', state:'Karnataka', address:'100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India', latitude:12.9783717, longitude:77.6408356, provider:'OPENSTREETMAP', locationAccuracyMeters:20, phone:'+91 91000 20005', email:'indiranagar@metaarch.local', admin:'Neha Indiranagar', openingTime:'09:00', closingTime:'22:00', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/organic,vegetables?lock=905', status:'Active', active:true, createdAt:now },
  { id:'store-whitefield', name:'Whitefield Fresh Basket', location:'Bengaluru', state:'Karnataka', address:'Whitefield Main Road, Whitefield, Bengaluru, Karnataka 560066, India', latitude:12.9698196, longitude:77.7499721, provider:'OPENSTREETMAP', locationAccuracyMeters:30, phone:'+91 91000 20012', email:'whitefield@metaarch.local', admin:'Manoj Whitefield', openingTime:'08:00', closingTime:'22:30', delivery:'Yes', pickup:'Yes', image:'https://loremflickr.com/900/600/fresh,grocery?lock=912', status:'Active', active:true, createdAt:now },
].map((store, index) => ({
  ...store,
  storeCode: store.storeCode || `${String(store.location || 'STORE').slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
  logoUrl: store.logoUrl || store.image,
  description: store.description || `${store.name} serving ${store.location} customers with groceries, pickup and configurable delivery.`,
  city: store.city || store.location,
  district: store.district || store.location,
  pincode: store.pincode || String(store.address || '').match(/\b\d{6}\b/)?.[0] || '',
  alternatePhone: store.alternatePhone || store.phone?.replace('200', '210'),
  storeRating: store.storeRating || [4.6, 4.5, 4.7, 4.55, 4.4, 4.5, 4.45, 4.35, 4.55, 4.65, 4.42, 4.68, 4.58, 4.48][index] || 4.5,
  gstNumber: store.gstNumber || `${store.state === 'Karnataka' ? '29' : store.state === 'Tamil Nadu' ? '33' : store.state === 'Andhra Pradesh' ? '37' : '36'}AABCM1234F1Z${(index % 9) + 1}`,
  deliveryRadiusKm: [10, 10, 8, 12, 6, 9, 7, 11, 8, 10, 9, 12, 7, 11][index] || 10,
  deliveryEtaMinutes: [20, 20, 18, 35, 40, 20, 24, 28, 21, 23, 26, 19, 22, 27][index] || 20,
  deliveryCharge: [35, 30, 30, 40, 25, 35, 30, 45, 35, 40, 38, 30, 35, 42][index] || 35,
  freeDeliveryAbove: [499, 499, 399, 599, 349, 499, 449, 699, 499, 599, 549, 399, 499, 649][index] || 499,
  deliveryModes,
  deliveryNotes: 'Delivery slots, pickup, express and scheduled delivery are configurable by the store manager.',
}));

const deliveryPartnerNames = [
  ['Amit Kumar', 'Bike'],
  ['Ravi Singh', 'Scooter'],
  ['Imran Khan', 'Electric Bike'],
  ['Suresh Babu', 'Bike'],
  ['Naveen Rao', 'Van'],
];

const deliveryPartnerPrefixByStore = {
  'india-store-1-1': 'hydmain',
  'india-store-1-3': 'srnagar',
  'store-gachibowli': 'gachibowli',
  'store-banjara': 'banjara',
  'store-secunderabad': 'secunderabad',
  'store-benzcircle': 'benzcircle',
  'store-governorpet': 'governorpet',
  'store-poranki': 'poranki',
  'store-tnagar': 'tnagar',
  'store-adyar': 'adyar',
  'store-velachery': 'velachery',
  'store-koramangala': 'koramangala',
  'store-indiranagar': 'indiranagar',
  'store-whitefield': 'whitefield',
};

const vehicleStateByLocation = {
  Hyderabad: 'TS',
  Vijayawada: 'AP',
  Chennai: 'TN',
  Bengaluru: 'KA',
};

const deliveryPartners = stores.flatMap((store, storeIndex) => {
  const prefix = deliveryPartnerPrefixByStore[store.id] || String(store.id).replace(/[^a-z0-9]/gi, '').toLowerCase();
  const vehicleState = vehicleStateByLocation[store.location] || 'IN';
  return deliveryPartnerNames.map(([name, vehicleType], partnerIndex) => {
    const partnerNumber = partnerIndex + 1;
    const suffix = String(partnerNumber).padStart(2, '0');
    const username = `deliverypartner${prefix}${suffix}`;
    const phoneSuffix = String(33000 + ((storeIndex + 1) * 10) + partnerNumber).padStart(5, '0');
    return {
      id: username,
      username,
      name: `${name} - ${store.name}`,
      email: `${username}@metaarch.local`,
      phone: `+91 90000 ${phoneSuffix}`,
      mobile: `+91 90000 ${phoneSuffix}`,
      role: 'delivery-partner',
      location: store.location,
      store: store.name,
      storeId: store.id,
      vehicleNumber: `${vehicleState}${String(10 + partnerNumber).padStart(2, '0')}DP${String((storeIndex + 1) * 100 + partnerNumber).padStart(4, '0')}`,
      vehicleType,
      address: store.address,
      emergencyContact: `+91 91000 ${String(49000 + ((storeIndex + 1) * 10) + partnerNumber).padStart(5, '0')}`,
      licenseNumber: `${vehicleState}-2026-${String((storeIndex + 1) * 100 + partnerNumber).padStart(4, '0')}`,
      password: 'admin123',
      status: 'Active',
      active: true,
      createdAt: now,
    };
  });
});

const users = [
  { id:'admin', username:'admin', name:'Super Admin', email:'admin@metaarch.local', mobile:'+91 90000 30000', role:'super-admin', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'globaladmin', username:'globaladmin', name:'Global Admin', email:'globaladmin@metaarch.local', mobile:'+91 90000 30001', role:'global-admin', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'locationadmin', username:'locationadmin', name:'Hyderabad Location Admin', email:'locationadmin@metaarch.local', mobile:'+91 90000 30002', role:'location-admin', location:'Hyderabad', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'locationadmin-hyd-2', username:'locationadminhyd2', name:'Hyderabad Deputy Admin', email:'locationadminhyd2@metaarch.local', mobile:'+91 90000 30012', role:'location-admin', location:'Hyderabad', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'locationadmin-vja-1', username:'locationadminvja', name:'Vijayawada Location Admin', email:'locationadminvja@metaarch.local', mobile:'+91 90000 30013', role:'location-admin', location:'Vijayawada', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'locationadmin-vja-2', username:'locationadminvja2', name:'Vijayawada Deputy Admin', email:'locationadminvja2@metaarch.local', mobile:'+91 90000 30014', role:'location-admin', location:'Vijayawada', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'locationadmin-chn-1', username:'locationadminchn', name:'Chennai Location Admin', email:'locationadminchn@metaarch.local', mobile:'+91 90000 30015', role:'location-admin', location:'Chennai', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'locationadmin-chn-2', username:'locationadminchn2', name:'Chennai Deputy Admin', email:'locationadminchn2@metaarch.local', mobile:'+91 90000 30016', role:'location-admin', location:'Chennai', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'locationadmin-blr-1', username:'locationadminblr', name:'Bengaluru Location Admin', email:'locationadminblr@metaarch.local', mobile:'+91 90000 30017', role:'location-admin', location:'Bengaluru', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'locationadmin-blr-2', username:'locationadminblr2', name:'Bengaluru Deputy Admin', email:'locationadminblr2@metaarch.local', mobile:'+91 90000 30018', role:'location-admin', location:'Bengaluru', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager', username:'storemanager', name:'Sravani Gachibowli', email:'storemanager@metaarch.local', mobile:'+91 90000 30003', role:'store-manager', location:'Hyderabad', store:'Gachibowli Fresh Hub', storeId:'store-gachibowli', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-hyd-main', username:'storemanagerhydmain', name:'Ramesh HYD Main', email:'storemanagerhydmain@metaarch.local', mobile:'+91 90000 30019', role:'store-manager', location:'Hyderabad', store:'Hyderabad Main Store', storeId:'india-store-1-1', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-srnagar', username:'storemanagersrnagar', name:'Vikram SR Nagar', email:'storemanagersrnagar@metaarch.local', mobile:'+91 90000 30030', role:'store-manager', location:'Hyderabad', store:'SR Nagar Store', storeId:'india-store-1-3', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-banjara', username:'storemanagerbanjara', name:'Mahesh Banjara', email:'storemanagerbanjara@metaarch.local', mobile:'+91 90000 30020', role:'store-manager', location:'Hyderabad', store:'Banjara Hills Pickle House', storeId:'store-banjara', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-secunderabad', username:'storemanagersecunderabad', name:'Anil Secunderabad', email:'storemanagersecunderabad@metaarch.local', mobile:'+91 90000 30021', role:'store-manager', location:'Hyderabad', store:'Secunderabad Daily Foods', storeId:'store-secunderabad', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-benzcircle', username:'storemanagerbenzcircle', name:'Lakshmi Benz Circle', email:'storemanagerbenzcircle@metaarch.local', mobile:'+91 90000 30022', role:'store-manager', location:'Vijayawada', store:'Benz Circle Fresh Basket', storeId:'store-benzcircle', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-governorpet', username:'storemanagergovernorpet', name:'Ravi Governorpet', email:'storemanagergovernorpet@metaarch.local', mobile:'+91 90000 30023', role:'store-manager', location:'Vijayawada', store:'Governorpet Spice Store', storeId:'store-governorpet', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-poranki', username:'storemanagerporanki', name:'Sneha Poranki', email:'storemanagerporanki@metaarch.local', mobile:'+91 90000 30024', role:'store-manager', location:'Vijayawada', store:'Poranki Fresh Mart', storeId:'store-poranki', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-tnagar', username:'storemanagertnagar', name:'Arun T Nagar', email:'storemanagertnagar@metaarch.local', mobile:'+91 90000 30025', role:'store-manager', location:'Chennai', store:'T Nagar Family Foods', storeId:'store-tnagar', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-adyar', username:'storemanageradyar', name:'Divya Adyar', email:'storemanageradyar@metaarch.local', mobile:'+91 90000 30026', role:'store-manager', location:'Chennai', store:'Adyar Organic Basket', storeId:'store-adyar', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-velachery', username:'storemanagervelachery', name:'Karthik Velachery', email:'storemanagervelachery@metaarch.local', mobile:'+91 90000 30027', role:'store-manager', location:'Chennai', store:'Velachery Daily Foods', storeId:'store-velachery', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-blr', username:'storemanagerblr', name:'Kiran Koramangala', email:'storemanagerblr@metaarch.local', mobile:'+91 90000 30005', role:'store-manager', location:'Bengaluru', store:'Koramangala Gourmet Mart', storeId:'store-koramangala', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-indiranagar', username:'storemanagerindiranagar', name:'Neha Indiranagar', email:'storemanagerindiranagar@metaarch.local', mobile:'+91 90000 30028', role:'store-manager', location:'Bengaluru', store:'Indiranagar Organic Foods', storeId:'store-indiranagar', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'storemanager-whitefield', username:'storemanagerwhitefield', name:'Manoj Whitefield', email:'storemanagerwhitefield@metaarch.local', mobile:'+91 90000 30029', role:'store-manager', location:'Bengaluru', store:'Whitefield Fresh Basket', storeId:'store-whitefield', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'deliverypartner', username:'deliverypartner', name:'Delivery Partner', email:'deliverypartner@metaarch.local', mobile:'+91 90000 30004', role:'delivery-partner', location:'Hyderabad', password:'admin123', status:'Active', active:true, createdAt:now },
  // eslint-disable-next-line no-unused-vars
  ...deliveryPartners.map(({ phone, vehicleNumber, vehicleType, address, emergencyContact, licenseNumber, ...partner }) => partner),
];

const delivery = [
  { id:'deliverypartner', name:'Delivery Partner', phone:'+91 90000 30004', email:'deliverypartner@metaarch.local', vehicleNumber:'TS09EA1234', vehicleType:'Bike', address:'Madhapur, Hyderabad', location:'Hyderabad', emergencyContact:'+91 90000 39999', licenseNumber:'TS-2026-1234', password:'admin123', status:'Active', active:true, createdAt:now },
  ...deliveryPartners,
  { id:'dp-hyd-002', name:'Ravi Kumar', phone:'+91 91000 40002', email:'ravi.delivery@metaarch.local', vehicleNumber:'TS09FB2244', vehicleType:'Scooter', address:'Kukatpally, Hyderabad', location:'Hyderabad', emergencyContact:'+91 91000 49992', licenseNumber:'TS-2026-2244', password:'admin123', status:'On Delivery', active:true, createdAt:now },
  { id:'dp-hyd-003', name:'Anil Reddy', phone:'+91 91000 40003', email:'anil.delivery@metaarch.local', vehicleNumber:'TS10GA3321', vehicleType:'Electric Bike', address:'Secunderabad, Hyderabad', location:'Hyderabad', emergencyContact:'+91 91000 49993', licenseNumber:'TS-2026-3321', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'dp-blr-001', name:'Kiran Shetty', phone:'+91 91000 40004', email:'kiran.delivery@metaarch.local', vehicleNumber:'KA03MC7788', vehicleType:'Bike', address:'Koramangala, Bengaluru', location:'Bengaluru', emergencyContact:'+91 91000 49994', licenseNumber:'KA-2026-7788', password:'admin123', status:'Active', active:true, createdAt:now },
  { id:'dp-chn-001', name:'Arun Prakash', phone:'+91 91000 40005', email:'arun.delivery@metaarch.local', vehicleNumber:'TN09DD6611', vehicleType:'Van', address:'T Nagar, Chennai', location:'Chennai', emergencyContact:'+91 91000 49995', licenseNumber:'TN-2026-6611', password:'admin123', status:'Active', active:true, createdAt:now },
];

const customers = [
  { id:'cust-hyd-001', name:'Karthik Reddy', phone:'+91 92000 50001', email:'karthik@example.com', location:'Hyderabad', spending:4280, notes:'Prefers spicy pickles and evening delivery.', status:'Active', active:true, createdAt:now },
  { id:'cust-hyd-002', name:'Priya Sharma', phone:'+91 92000 50002', email:'priya@example.com', location:'Hyderabad', spending:2650, notes:'Weekly vegetables customer.', status:'Active', active:true, createdAt:now },
  { id:'cust-hyd-003', name:'Mohammed Ali', phone:'+91 92000 50003', email:'ali@example.com', location:'Hyderabad', spending:7190, notes:'Orders chicken and dry fruits frequently.', status:'Active', active:true, createdAt:now },
  { id:'cust-blr-001', name:'Neha Rao', phone:'+91 92000 50004', email:'neha@example.com', location:'Bengaluru', spending:3520, notes:'Organic vegetables.', status:'Active', active:true, createdAt:now },
  { id:'cust-chn-001', name:'Suresh Iyer', phone:'+91 92000 50005', email:'suresh@example.com', location:'Chennai', spending:1980, notes:'COD customer.', status:'Active', active:true, createdAt:now },
  { id:'cust-vja-001', name:'Lakshmi Devi', phone:'+91 92000 50006', email:'lakshmi@example.com', location:'Vijayawada', spending:2890, notes:'Dry fruits gift orders.', status:'Active', active:true, createdAt:now },
];

const item = (id, title, price, quantity, store, location) => ({ id, productId:id, title, productName:title, price, unitPrice:price, quantity, sourceStore:store, store, sourceLocation:location, location });

const orders = [
  { id:'ORD-HYD-1001', status:'CREATED', paymentStatus:'SUCCESS', paymentMethod:'UPI', total:890, totalAmount:890, customer:{ id:'cust-hyd-001', name:'Karthik Reddy', phone:'+91 92000 50001' }, items:[item('21000000-0000-0000-0000-000000000001','Andhra Mango Pickle',240,2,'Gachibowli Fresh Hub','Hyderabad'), item('21000000-0000-0000-0000-000000000011','Fresh Tomatoes',82,5,'Gachibowli Fresh Hub','Hyderabad')], sourceStore:'Gachibowli Fresh Hub', store:'Gachibowli Fresh Hub', sourceLocation:'Hyderabad', location:'Hyderabad', channel:'Nearby Store', fulfillmentType:'nearby', checkout:{ deliveryAddress:'Gachibowli, Hyderabad', total:890 }, createdAt:'2026-09-05T07:30:00.000Z' },
  { id:'ORD-HYD-1002', status:'CONFIRMED', paymentStatus:'PENDING', paymentMethod:'COD', total:1240, totalAmount:1240, customer:{ id:'cust-hyd-002', name:'Priya Sharma', phone:'+91 92000 50002' }, items:[item('21000000-0000-0000-0000-000000000014','Fresh Carrots',95,3,'Secunderabad Daily Foods','Hyderabad'), item('21000000-0000-0000-0000-000000000015','Fresh Beans',120,2,'Secunderabad Daily Foods','Hyderabad')], sourceStore:'Secunderabad Daily Foods', store:'Secunderabad Daily Foods', sourceLocation:'Hyderabad', location:'Hyderabad', channel:'Nearby Store', fulfillmentType:'nearby', checkout:{ deliveryAddress:'Begumpet, Hyderabad', total:1240 }, deliveryPartnerId:'dp-hyd-003', deliveryPartner:{ id:'dp-hyd-003', name:'Anil Reddy', vehicleNumber:'TS10GA3321' }, createdAt:'2026-09-04T12:15:00.000Z' },
  { id:'ORD-HYD-1003', status:'PROCESSING', paymentStatus:'SUCCESS', paymentMethod:'CARD', total:2180, totalAmount:2180, customer:{ id:'cust-hyd-003', name:'Mohammed Ali', phone:'+91 92000 50003' }, items:[item('21000000-0000-0000-0000-000000000018','Chicken Curry Cut',260,3,'Banjara Hills Pickle House','Hyderabad'), item('21000000-0000-0000-0000-000000000006','Premium Cashews',520,1,'Banjara Hills Pickle House','Hyderabad')], sourceStore:'Banjara Hills Pickle House', store:'Banjara Hills Pickle House', sourceLocation:'Hyderabad', location:'Hyderabad', channel:'Nearby Store', fulfillmentType:'nearby', checkout:{ deliveryAddress:'Banjara Hills, Hyderabad', total:2180 }, createdAt:'2026-09-03T16:45:00.000Z' },
  { id:'ORD-HYD-1004', status:'SHIPPED', paymentStatus:'SUCCESS', paymentMethod:'UPI', total:1545, totalAmount:1545, customer:{ id:'cust-hyd-001', name:'Karthik Reddy', phone:'+91 92000 50001' }, items:[item('21000000-0000-0000-0000-000000000020','Prawns Medium',430,2,'Gachibowli Fresh Hub','Hyderabad')], sourceStore:'Gachibowli Fresh Hub', store:'Gachibowli Fresh Hub', sourceLocation:'Hyderabad', location:'Hyderabad', channel:'Nearby Store', fulfillmentType:'nearby', checkout:{ deliveryAddress:'Madhapur, Hyderabad', total:1545 }, deliveryPartnerId:'deliverypartner', deliveryPartner:{ id:'deliverypartner', name:'Delivery Partner', vehicleNumber:'TS09EA1234' }, createdAt:'2026-09-02T10:05:00.000Z' },
  { id:'ORD-HYD-1005', status:'DELIVERED', paymentStatus:'SUCCESS', paymentMethod:'UPI', total:740, totalAmount:740, customer:{ id:'cust-hyd-002', name:'Priya Sharma', phone:'+91 92000 50002' }, items:[item('21000000-0000-0000-0000-000000000003','Garlic Pickle',210,2,'Gachibowli Fresh Hub','Hyderabad')], sourceStore:'Gachibowli Fresh Hub', store:'Gachibowli Fresh Hub', sourceLocation:'Hyderabad', location:'Hyderabad', channel:'Nearby Store', fulfillmentType:'nearby', checkout:{ deliveryAddress:'Kondapur, Hyderabad', total:740 }, deliveredAt:'2026-09-01T15:30:00.000Z', createdAt:'2026-09-01T09:10:00.000Z' },
  { id:'ORD-HYD-1006', status:'CANCELLED', paymentStatus:'REFUNDED', paymentMethod:'CARD', total:560, totalAmount:560, customer:{ id:'cust-hyd-003', name:'Mohammed Ali', phone:'+91 92000 50003' }, items:[item('21000000-0000-0000-0000-000000000012','Green Chillies',75,4,'Secunderabad Daily Foods','Hyderabad')], sourceStore:'Secunderabad Daily Foods', store:'Secunderabad Daily Foods', sourceLocation:'Hyderabad', location:'Hyderabad', channel:'Nearby Store', fulfillmentType:'nearby', checkout:{ deliveryAddress:'Himayatnagar, Hyderabad', total:560 }, createdAt:'2026-08-31T11:00:00.000Z' },
  { id:'ORD-BLR-2001', status:'CONFIRMED', paymentStatus:'SUCCESS', paymentMethod:'UPI', total:1890, totalAmount:1890, customer:{ id:'cust-blr-001', name:'Neha Rao', phone:'+91 92000 50004' }, items:[item('21000000-0000-0000-0000-000000000009','Pistachios',680,2,'Koramangala Gourmet Mart','Bengaluru')], sourceStore:'Koramangala Gourmet Mart', store:'Koramangala Gourmet Mart', sourceLocation:'Bengaluru', location:'Bengaluru', channel:'Nearby Store', fulfillmentType:'nearby', checkout:{ deliveryAddress:'HSR Layout, Bengaluru', total:1890 }, createdAt:'2026-09-04T08:20:00.000Z' },
  { id:'ORD-GLB-3001', status:'CREATED', paymentStatus:'SUCCESS', paymentMethod:'CARD', total:2450, totalAmount:2450, customer:{ id:'cust-chn-001', name:'Suresh Iyer', phone:'+91 92000 50005' }, items:[item('21000000-0000-0000-0000-000000000008','California Almonds',590,2,'Gachibowli Fresh Hub','Hyderabad')], sourceStore:'Gachibowli Fresh Hub', store:'Gachibowli Fresh Hub', sourceLocation:'Hyderabad', location:'Chennai', destinationLocation:'Chennai', channel:'India-wide Global Store', fulfillmentType:'global', globalApproval:'Pending', checkout:{ deliveryAddress:'T Nagar, Chennai', total:2450 }, createdAt:'2026-09-05T06:10:00.000Z' },
];

const reviews = [
  { id:'rev-001', name:'Karthik Reddy', product:'Andhra Mango Pickle', productId:'21000000-0000-0000-0000-000000000001', text:'Good spice balance and fresh oil aroma.', rating:5, location:'Hyderabad', status:'Approved', image:'https://loremflickr.com/600/500/indian,pickle?lock=801', helpful:14, active:true, createdAt:now },
  { id:'rev-002', name:'Priya Sharma', product:'Fresh Tomatoes', productId:'21000000-0000-0000-0000-000000000011', text:'Firm tomatoes, packed well.', rating:4, location:'Hyderabad', status:'Approved', image:'https://loremflickr.com/600/500/tomatoes,food?lock=802', helpful:8, active:true, createdAt:now },
];

const coupons = [
  { id:'coupon-hyd10', name:'HYD10', couponName:'Hyderabad Fresh Saver', description:'10% off Hyderabad store orders.', discountType:'Percentage', discount:10, minimumOrder:499, maximumDiscount:150, startDate:'2026-09-01', expiry:'2026-12-31', usageLimit:500, perUserLimit:2, scope:'Location', location:'Hyderabad', eligibility:'All customers', status:'Active', active:true, createdAt:now },
  { id:'coupon-global75', name:'GLOBAL75', couponName:'Global Order Discount', description:'Flat discount on global dry fruit orders.', discountType:'Fixed', discount:75, minimumOrder:999, maximumDiscount:75, startDate:'2026-09-01', expiry:'2026-12-31', usageLimit:300, perUserLimit:1, scope:'Global', eligibility:'All customers', status:'Active', active:true, createdAt:now },
];

const notifications = [
  { id:'note-001', title:'Order spike in Hyderabad', name:'Order spike in Hyderabad', message:'Hyderabad stores have 6 demo orders across created, confirmed, processing, shipped, delivered and cancelled states.', type:'order', audience:'Location Admin', location:'Hyderabad', read:false, createdAt:now },
  { id:'note-002', title:'Inventory ready', name:'Inventory ready', message:'23 active catalog inventory rows are available for demo.', type:'inventory', audience:'All Admins', read:false, createdAt:now },
];

export const bootstrapDemoData = () => {
  upsertById('local:locations', locations);
  upsertById('local:stores', stores);
  upsertById('local:users', users);
  upsertById('local:delivery', delivery);
  upsertById('local:customers', customers);
  upsertById('local:reviews', reviews);
  upsertById('local:coupons', coupons);
  upsertById('orders', orders);
  upsertById('notifications', notifications);
  localStorage.setItem('demo-data-version', '2026-09-05-four-city-store-demo');
};
