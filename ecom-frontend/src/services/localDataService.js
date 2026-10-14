const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const isQuotaError = (error) => error?.name === 'QuotaExceededError'
  || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  || error?.code === 22
  || error?.code === 1014;

const compactImage = (image) => {
  if (typeof image !== 'string') return image || '';
  if (/^data:image\//i.test(image) && image.length > 20000) return '';
  return image;
};

const compactLine = (line = {}) => ({
  key: line.key,
  productId: line.productId,
  variantId: line.variantId ?? null,
  storeId: line.storeId,
  storeName: line.storeName,
  fulfillmentType: line.fulfillmentType,
  deliveryType: line.deliveryType,
  deliveryLabel: line.deliveryLabel,
  estimatedDelivery: line.estimatedDelivery,
  deliveryCharge: line.deliveryCharge,
  sourceLocation: line.sourceLocation,
});

const compactOrder = (order = {}) => ({
  ...order,
  items: (order.items || []).map((item) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId ?? null,
    title: item.title || item.productName || item.name,
    productName: item.productName || item.title || item.name,
    quantity: item.quantity,
    price: item.price,
    unitPrice: item.unitPrice,
    weight: item.weight,
    image: compactImage(item.image || item.imageUrl || item.productImage || item.thumbnailUrl || ''),
    deliveryLabel: item.deliveryLabel,
    estimatedDelivery: item.estimatedDelivery,
    deliveryCharge: item.deliveryCharge,
    fulfillmentType: item.fulfillmentType,
    globalApproval: item.globalApproval,
    storeId: item.storeId,
    store: item.store,
    sourceStore: item.sourceStore,
    sourceStoreId: item.sourceStoreId,
    sourceLocation: item.sourceLocation,
    sourceState: item.sourceState,
  })),
  deliveryLines: (order.deliveryLines || []).map(compactLine),
  checkout: order.checkout ? {
    ...order.checkout,
    deliveryLines: (order.checkout.deliveryLines || []).map(compactLine),
    cartItems: undefined,
    items: undefined,
  } : order.checkout,
  payment: order.payment ? {
    paymentId: order.payment.paymentId,
    status: order.payment.status,
    method: order.payment.method,
    provider: order.payment.provider,
    paidAt: order.payment.paidAt,
  } : order.payment,
  trackingEvents: (order.trackingEvents || []).slice(-12),
});

const compactOrders = (orders, limit = 40) => (Array.isArray(orders) ? orders : [])
  .filter((order) => order?.id)
  .map(compactOrder)
  .slice(0, limit);

const compactForStorage = (key, value, limit = 40) => {
  if (key === 'orders' || key === 'local:orders') return compactOrders(value, limit);
  if (key === 'notifications') return (Array.isArray(value) ? value : []).slice(0, 80);
  return value;
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('local-data-change', { detail: { key, value } }));
    return value;
  } catch (error) {
    if (!isQuotaError(error)) throw error;
    const limits = key === 'orders' || key === 'local:orders' ? [30, 10, 3, 1] : [40];
    let lastError = error;
    for (const limit of limits) {
      const compacted = compactForStorage(key, value, limit);
      if (key === 'orders') localStorage.removeItem('local:orders');
      if (key === 'local:orders') localStorage.removeItem('orders');
      try {
        localStorage.setItem(key, JSON.stringify(compacted));
        window.dispatchEvent(new CustomEvent('local-data-change', { detail: { key, value: compacted } }));
        return compacted;
      } catch (retryError) {
        if (!isQuotaError(retryError)) throw retryError;
        lastError = retryError;
      }
    }
    throw lastError;
  }
};

const delay = (value, ms = 250) => new Promise((resolve) => setTimeout(() => resolve(value), ms));



const itemLineKey = (item = {}) => `${item.storeId || item.sourceStoreId || item.store || item.storeName || 'store'}:${item.productId || item.id || ''}:${item.variantId ?? 'product'}`;
const orderLineKey = (line = {}, fallback = {}) => `${line.fulfillmentType || fallback.fulfillmentType || 'nearby'}:${line.storeId || fallback.storeId || fallback.sourceStoreId || 'store'}:${line.deliveryType || fallback.deliveryType || 'standard'}`;
const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const authStore = {
  async requestOtp() { throw new Error('Please use the customer login page to request a verification code.'); },
  async verifyOtp() { throw new Error('Please use the customer login page to verify your code.'); },
  async emailLogin(email, password) { const { customerAuthService } = await import('./customerAuthService'); return customerAuthService.login(email, password); },
  async socialLogin() { throw new Error('Please sign in using email and password.'); },
};

export const profileStore = {
  update(profile) {
    const current = read('user', {});
    const user = { ...current, ...profile };
    write('user', user);
    write('localUsers', read('localUsers', []).map((item) => item.id === user.id ? user : item));
    return delay(user);
  },
  remove() {
    const current = read('user', null);
    if (current) write('localUsers', read('localUsers', []).filter((item) => item.id !== current.id));
    ['user', 'authToken', 'isLoggedIn', 'cartItems', 'wishlistItems', 'addresses'].forEach((key) => localStorage.removeItem(key));
    return delay({ deleted: true });
  },
};

export const orderStore = {
  create({ cartItems, checkout, paymentMethod, localOrderId, payment }) {
    const orders = read('orders', []);
    const currentUser = read('user', {});
    const stores = read('local:stores', []);
    const lines = Array.isArray(checkout?.deliveryLines) ? checkout.deliveryLines : [];
    const enrichedItems = cartItems.map((item, index) => { const line=lines.find((entry)=>entry.key===itemLineKey(item))||lines.find((entry)=>entry.storeId&&(entry.storeId===item.storeId||entry.storeId===item.sourceStoreId)&&entry.productId===item.productId&&(entry.variantId??null)===(item.variantId??null))||lines.find((entry)=>entry.productId===item.productId&&(entry.variantId??null)===(item.variantId??null))||lines[index]||{}; const store=stores.find((entry)=>entry.id===line.storeId||entry.name===line.storeName||entry.id===item.storeId||entry.id===item.sourceStoreId||entry.name===item.sourceStore||entry.name===item.store||entry.name===item.storeName);return {...item,deliveryLine:line,deliveryLabel:line.deliveryLabel||item.deliveryLabel,estimatedDelivery:line.estimatedDelivery||item.estimatedDelivery,deliveryCharge:Number(line.deliveryCharge||item.deliveryCharge||0),fulfillmentType:line.fulfillmentType||item.fulfillmentType,globalApproval:line.globalApproval||item.globalApproval,storeId:store?.id||line.storeId||item.storeId||item.sourceStoreId||checkout?.sourceStoreId||'',store:store?.name||line.storeName||item.store||item.storeName||item.sourceStore||checkout?.sourceStore||'',sourceStore:store?.name||line.storeName||item.sourceStore||item.store||item.storeName||checkout?.sourceStore||'',sourceLocation:store?.location||item.sourceLocation||item.location||line.sourceLocation||checkout?.sourceLocation||'',sourceState:store?.state||item.state||checkout?.sourceState||''}; });
    const customerLocation=checkout?.customerLocation || '';
    const groups = enrichedItems.reduce((map, item) => {
      const key = orderLineKey(item.deliveryLine, item);
      map[key] = map[key] || [];
      map[key].push(item);
      return map;
    }, {});
    const handlingTotal = Number(checkout?.handlingFee || 0);
    const discountTotal = Number(checkout?.discount || 0);
    const groupEntries = Object.entries(groups);
    const baseId = localOrderId || `ORD-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const createdOrders = groupEntries.map(([key, items], index) => {
      const primarySource = items[0] || {};
      const groupLines = items.map((item) => item.deliveryLine).filter((line) => line?.key);
      const subtotal = items.reduce((sum,item)=>sum+Number(item.price||item.unitPrice||0)*Number(item.quantity||0),0);
      const deliveryFee = groupLines.reduce((sum,line)=>sum+Number(line.deliveryCharge||0),0);
      const handlingFee = index === 0 ? handlingTotal : 0;
      const discount = index === 0 ? discountTotal : 0;
      const total = subtotal + deliveryFee + handlingFee - discount;
      const isGlobal = key.startsWith('global:') || groupLines.some((line)=>line.fulfillmentType==='global') || checkout?.fulfillmentType === 'global';
      const deliveryOtp = String(Math.floor(100000 + Math.random() * 900000));
      return {
        id: groupEntries.length > 1 ? `${baseId}-${index + 1}` : baseId,
        parentOrderId: groupEntries.length > 1 ? baseId : '',
        items: items.map((item)=>({...item,...(item.offerType==='Buy X Get Y'?{buyQuantity:Number(item.buyQuantity||1),freeQuantity:Math.floor(Number(item.quantity||1)/Number(item.buyQuantity||1))*Number(item.freeQuantity||1)}:{})})),
        fulfillmentType:isGlobal?'global':'nearby',
        channel:isGlobal?'5-7 Days Delivery':'Nearby Store',
        deliveryLines:groupLines,
        deliveryLabel:isGlobal?'5-7 days delivery':groupLines[0]?.deliveryLabel,
        estimatedDelivery:isGlobal?'5-7 days':groupLines[0]?.estimatedDelivery,
        sourceStore:primarySource.sourceStore,
        sourceStoreId:primarySource.storeId,
        sourceLocation:primarySource.sourceLocation,
        sourceState:primarySource.sourceState,
        store:primarySource.sourceStore,
        storeId:primarySource.storeId,
        location:primarySource.sourceLocation,
        destinationLocation:customerLocation,
        customerLatitude:checkout?.customerLatitude ?? null,
        customerLongitude:checkout?.customerLongitude ?? null,
        storeLatitude:checkout?.storeLatitude ?? groupLines[0]?.quote?.storeLatitude ?? null,
        storeLongitude:checkout?.storeLongitude ?? groupLines[0]?.quote?.storeLongitude ?? null,
        globalApproval:isGlobal?'Pending':'Not Required',
        fulfillment:{id:`ful_${baseId}_${index+1}`,orderId:groupEntries.length > 1 ? `${baseId}-${index + 1}` : baseId,customerId:currentUser.id,storeId:primarySource.storeId,fulfillmentType:'SHIP_TO_HOME',status:'PENDING',createdAt},
        shipment:{id:`ship_${baseId}_${index+1}`,orderId:groupEntries.length > 1 ? `${baseId}-${index + 1}` : baseId,carrier:isGlobal?'Long Distance Delivery':'Store Delivery',trackingNumber:`TRK${Date.now()}${index+1}`,status:'CREATED',estimatedDeliveryDate:isGlobal?addDays(7):addDays(1),createdAt},
        trackingEvents:[{id:crypto.randomUUID(),status:'CREATED',description:`Order placed for ${primarySource.sourceStore || 'store'}`,location:primarySource.sourceLocation || '',eventTime:createdAt}],
        customer: { id:currentUser.id,name:currentUser.name || 'Customer',phone:checkout?.contactNumber || currentUser.phone || '',email:currentUser.email || '' },
        checkout: { ...(checkout || {}), deliveryLines:groupLines, subtotal, deliveryFee, handlingFee, discount, total },
        paymentMethod,
        paymentStatus: 'PENDING',
        payment: payment || null,
        status: 'CREATED',
        deliveryOtp,
        deliveryOtpVerified: false,
        createdAt,
        total,
        totalAmount: total,
      };
    });
    const nextOrders = [...createdOrders, ...orders];
    write('orders', nextOrders);
    write('local:orders', nextOrders);
    const notifications = read('notifications', []);
    write('notifications', [...createdOrders.map((order) => ({ id: crypto.randomUUID(), title: 'Order Placed', subject:'Order Placed', message: `${order.id} has been placed for ${order.sourceStore}.`, type: 'order', notificationType:'ORDER_CREATED', channel:'PUSH', status:'SENT', orderId: order.id, customerId:currentUser.id, recipient:checkout?.contactNumber || currentUser.phone || currentUser.email || '', read: false, sentAt:createdAt, createdAt })), ...notifications]);
    const loyalty = read('loyalty', { points: 100, referralCode: 'PICKLES100', vouchers: [], referrals: 0 });
    const total = createdOrders.reduce((sum,order)=>sum+Number(order.total||0),0);
    write('loyalty', { ...loyalty, points: loyalty.points + Math.floor(total / 10) });
    return delay(createdOrders.length > 1 ? { id:baseId, childOrders:createdOrders, items:enrichedItems, total, totalAmount:total, paymentStatus:'PENDING', status:'CREATED' } : createdOrders[0], 500);
  },
  recordBackendOrder(orderResult, { cartItems = [], checkout = {}, paymentMethod = '', payment = null } = {}) {
    if (!orderResult?.id) return null;
    const orders = read('orders', []);
    const currentUser = read('user', {});
    const lines = Array.isArray(checkout.deliveryLines) ? checkout.deliveryLines : [];
    const firstLine = lines[0] || {};
    const isGlobal = lines.some((line) => line.fulfillmentType === 'global') || ['global', 'mixed', 'long-distance'].includes(checkout.fulfillmentType);
    const stores = read('local:stores', []);
    const store = stores.find((entry) => entry.id === orderResult.storeId || entry.id === checkout.sourceStoreId || entry.name === checkout.sourceStore);
    const now = new Date().toISOString();
    const deliveryOtp = orders.find((order) => order.id === orderResult.id)?.deliveryOtp || String(Math.floor(100000 + Math.random() * 900000));
    const items = (orderResult.items?.length ? orderResult.items : cartItems).map((item, index) => {
      const line = lines.find((entry) => entry.key === itemLineKey(item)) || lines[index] || firstLine;
      return {
        ...item,
        title: item.title || item.productName || item.name || 'Product',
        price: Number(item.price ?? item.unitPrice ?? 0),
        quantity: Number(item.quantity || 1),
        deliveryLine: line,
        image: item.image || item.imageUrl || item.productImage || '',
        deliveryLabel: isGlobal ? '5-7 days delivery' : line.deliveryLabel,
        estimatedDelivery: isGlobal ? '5-7 days' : line.estimatedDelivery,
        deliveryCharge: Number(line.deliveryCharge || 0),
        fulfillmentType: isGlobal ? 'global' : line.fulfillmentType,
        globalApproval: isGlobal ? 'Pending' : line.globalApproval,
        storeId: isGlobal ? line.storeId || checkout.sourceStoreId || store?.id || orderResult.storeId || '' : orderResult.storeId || line.storeId || checkout.sourceStoreId || store?.id || '',
        store: store?.name || line.storeName || checkout.sourceStore || orderResult.store || '',
        sourceStore: store?.name || line.storeName || checkout.sourceStore || orderResult.store || '',
        sourceLocation: store?.location || line.sourceLocation || checkout.sourceLocation || '',
      };
    });
    const record = {
      id: orderResult.id,
      backendOrderId: orderResult.id,
      backendOrderNumber: orderResult.orderNumber || '',
      orderNumber: orderResult.orderNumber || orderResult.id,
      customerId: orderResult.customerId || currentUser.id,
      cartId: orderResult.cartId,
      items,
      fulfillmentType: isGlobal ? 'global' : checkout.fulfillmentType || firstLine.fulfillmentType || 'nearby',
      channel: isGlobal ? '5-7 Days Delivery' : checkout.channel || 'Nearby Store',
      deliveryLines: lines,
      deliveryLabel: isGlobal ? '5-7 days delivery' : firstLine.deliveryLabel,
      estimatedDelivery: isGlobal ? '5-7 days' : firstLine.estimatedDelivery,
      sourceStore: store?.name || firstLine.storeName || checkout.sourceStore || orderResult.storeId,
      sourceStoreId: isGlobal ? firstLine.storeId || checkout.sourceStoreId || store?.id || orderResult.storeId || '' : orderResult.storeId || firstLine.storeId || checkout.sourceStoreId || store?.id || '',
      sourceLocation: store?.location || firstLine.sourceLocation || checkout.sourceLocation || '',
      sourceState: store?.state || checkout.sourceState || '',
      store: store?.name || firstLine.storeName || checkout.sourceStore || orderResult.storeId,
      storeId: isGlobal ? firstLine.storeId || checkout.sourceStoreId || store?.id || orderResult.storeId || '' : orderResult.storeId || firstLine.storeId || checkout.sourceStoreId || store?.id || '',
      location: store?.location || checkout.sourceLocation || '',
      destinationLocation: checkout.customerLocation || '',
      checkout,
      customer: { id:currentUser.id || orderResult.customerId, name:currentUser.name || 'Customer', phone:checkout.contactNumber || currentUser.phone || '', email:currentUser.email || '' },
      paymentMethod,
      paymentStatus: payment?.status || orderResult.paymentStatus || 'PENDING',
      payment,
      status: orderResult.status || 'CREATED',
      globalApproval: isGlobal ? 'Pending' : 'Not Required',
      deliveryOtp,
      deliveryOtpVerified: false,
      fulfillment:isGlobal ? null : { id:`ful_${orderResult.id}`, orderId:orderResult.id, customerId:orderResult.customerId || currentUser.id, storeId:orderResult.storeId || checkout.sourceStoreId, fulfillmentType:'SHIP_TO_HOME', status:'PENDING', createdAt:now },
      shipment:isGlobal ? null : { id:`ship_${orderResult.id}`, orderId:orderResult.id, carrier:'Store Delivery', trackingNumber:`TRK${Date.now()}`, status:'CREATED', estimatedDeliveryDate:addDays(1), createdAt:now },
      trackingEvents:[{ id:crypto.randomUUID(), status:orderResult.status || 'CREATED', description:`Order placed for ${store?.name || checkout.sourceStore || 'store'}`, location:store?.location || checkout.sourceLocation || '', eventTime:now }],
      createdAt: orderResult.createdAt || now,
      updatedAt: orderResult.updatedAt || now,
      total: Number(orderResult.totalAmount || checkout.total || 0),
      totalAmount: Number(orderResult.totalAmount || checkout.total || 0),
    };
    const nextOrders = [record, ...orders.filter((order) => order.id !== record.id)];
    write('orders', nextOrders);
    write('local:orders', nextOrders);
    return record;
  },
  list: () => {
    const orders = read('orders', []);
    const localOrders = read('local:orders', []);
    return [...orders, ...localOrders].filter((order, index, items) => order?.id && items.findIndex((entry) => entry?.id === order.id) === index);
  },
  applyPayment(orderResult, payment) {
    const ids = orderResult?.childOrders?.length ? orderResult.childOrders.map((order) => order.id) : [orderResult?.id].filter(Boolean);
    const paidAt = new Date().toISOString();
    const currentOrders = read('orders', []);
    const orders = currentOrders.map((order) => ids.includes(order.id) ? {
      ...order,
      payment,
      paymentStatus: payment?.status || 'SUCCESS',
      paidAt,
    } : order);
    write('orders', orders);
    write('local:orders', orders);
    write('notifications', [
      ...ids.map((id) => {
        const order = currentOrders.find((item) => item.id === id) || {};
        return { id:crypto.randomUUID(), title:'Payment Successful', subject:'Payment Successful', message:`Payment ${payment?.paymentId || ''} was confirmed for ${id}.`, type:'order', notificationType:'PAYMENT_SUCCESS', channel:'PUSH', status:'SENT', orderId:id, customerId:order.customer?.id, recipient:order.customer?.phone || order.customer?.email || '', read:false, sentAt:paidAt, createdAt:paidAt };
      }),
      ...read('notifications', []),
    ]);
    return orderResult?.childOrders?.length ? { ...orderResult, childOrders:orders.filter((order) => ids.includes(order.id)) } : orders.find((order) => order.id === orderResult?.id);
  },
  assignPartner(id, partner) {
    const current = read('orders', []).find((order) => order.id === id);
    if (!current) throw new Error('Order not found.');
    if (current.fulfillmentType === 'global') throw new Error('Global orders use parcel carriers, not local delivery partners.');
    if (!partner?.id) throw new Error('Select an active delivery partner.');
    if (partner.status !== 'Active' || partner.active === false) throw new Error('Only active delivery partners can be assigned.');
    const orderStoreId = current.storeId || current.sourceStoreId || current.assignedStoreId || '';
    const orderStoreName = current.store || current.sourceStore || '';
    if (partner.storeId && orderStoreId && partner.storeId !== orderStoreId) throw new Error('Select a delivery partner from this order store.');
    if (!partner.storeId && partner.store && orderStoreName && partner.store !== orderStoreName) throw new Error('Select a delivery partner from this order store.');
    if (['DELIVERED', 'Delivered', 'CANCELLED', 'Cancelled', 'Returned'].includes(current.status)) throw new Error('Completed or cancelled orders cannot be assigned.');
    const assignedAt = new Date().toISOString();
    const assignment = { id:partner.id, name:partner.name, phone:partner.phone, vehicleNumber:partner.vehicleNumber || partner.vehicle, vehicleType:partner.vehicleType, assignedAt };
    const orders = read('orders', []).map((order) => order.id === id ? {
      ...order,
      deliveryPartner: assignment,
      deliveryPartnerId: partner.id,
      assignedAt,
      deliveryAssignmentStatus: 'ASSIGNED',
      trackingEvents: [...(order.trackingEvents || []), { id:crypto.randomUUID(), status:'ASSIGNED', description:`Delivery partner assigned: ${partner.name}`, location:order.sourceLocation || order.location || '', eventTime:assignedAt }],
    } : order);
    write('orders', orders);
    write('local:orders', orders);
    write('notifications', [{ id:crypto.randomUUID(),title:'Delivery partner assigned',subject:'Delivery partner assigned',message:`${partner.name} was assigned to ${id}.`,type:'order',notificationType:'ORDER_STATUS_UPDATED',channel:'PUSH',status:'SENT',orderId:id,customerId:current.customer?.id,recipient:current.customer?.phone || current.customer?.email || '',read:false,sentAt:assignedAt,createdAt:assignedAt },...read('notifications', [])]);
    return orders.find((order) => order.id === id);
  },
  acceptDeliveryAssignment(id) {
    const current = read('orders', []).find((order) => order.id === id);
    if (!current) throw new Error('Order not found.');
    if (!current.deliveryPartnerId) throw new Error('This order is not assigned to you.');
    const acceptedAt = new Date().toISOString();
    const orders = read('orders', []).map((order) => order.id === id ? {
      ...order,
      deliveryAcceptedAt: acceptedAt,
      deliveryAssignmentStatus: 'ACCEPTED',
      trackingEvents: [...(order.trackingEvents || []), { id:crypto.randomUUID(), status:'DELIVERY_ACCEPTED', description:`${order.deliveryPartner?.name || 'Delivery partner'} accepted the assignment`, location:order.sourceLocation || order.location || '', eventTime:acceptedAt }],
    } : order);
    write('orders', orders);
    write('local:orders', orders);
    return orders.find((order) => order.id === id);
  },
  approveGlobal(id) {
    const current=read('orders',[]).find((order)=>order.id===id);
    if(!current||current.fulfillmentType!=='global') throw new Error('Global order not found.');
    if(current.globalApproval==='Approved') throw new Error('This global order is already approved and transferred.');
    const firstOption=this.globalStoreOptions(id)[0];
    if(!firstOption) throw new Error('No active store has enough stock for this complete order.');
    return this.assignGlobalStore(id,firstOption.store.id);
  },
  globalStoreOptions(id) {
    const order=read('orders',[]).find((item)=>item.id===id);
    if(!order||order.fulfillmentType!=='global') return [];
    const stores=read('local:stores',[]).filter((store)=>store.status!=='Inactive'&&store.active!==false);
    const products=read('local:products',[]);
    const requested=order.items||[];
    return stores.map((store)=>{
      const matches=requested.map((item)=>{
        const product=products.find((entry)=>(entry.productId===item.productId||entry.id===item.productId||entry.title===item.title||entry.name===item.title)&&(entry.storeId===store.id||entry.store===store.name||entry.storeName===store.name));
        const stock=Number(product?.stock??product?.availableQuantity??0);
        return {requested:item,product,stock};
      });
      return {store,matches,distanceLabel:store.location===order.destinationLocation||String(order.checkout?.deliveryAddress||'').includes(store.location)?'Same city':'5-7 days'};
    }).filter((option)=>option.matches.length&&option.matches.every(({product,stock,requested})=>product&&stock>=Number(requested.quantity||1)));
  },
  assignGlobalStore(id, storeId) {
    const current=read('orders',[]).find((order)=>order.id===id);if(!current)throw new Error('Order not found.');if(current.globalApproval==='Approved')throw new Error('This order has already been assigned.');
    const option=this.globalStoreOptions(id).find((item)=>item.store.id===storeId);if(!option)throw new Error('The selected store cannot fulfil every item in this order.');
    const assignedAt=new Date().toISOString();const assignedItems=option.matches.map(({requested,product})=>({...requested,id:product.id,image:requested.image||product.image||product.thumbnail||'',deliveryLabel:'5-7 days delivery',estimatedDelivery:'5-7 days',sourceStore:option.store.name,sourceStoreId:option.store.id,sourceLocation:option.store.location,sourceState:option.store.state}));
    const assignment={storeId:option.store.id,store:option.store.name,location:option.store.location,state:option.store.state,status:'Assigned',assignedAt};
    const orders=read('orders',[]).map((order)=>order.id===id?{...order,items:assignedItems,fulfilmentAssignments:[assignment],globalApproval:'Approved',globalApprovedAt:assignedAt,status:'CONFIRMED',deliveryLabel:'5-7 days delivery',estimatedDelivery:'5-7 days',transferredToStore:true,assignmentMethod:option.nearby?'Global Admin selected nearby stocked store':'Global Admin selected stocked store',assignedStoreId:option.store.id,sourceStore:option.store.name,sourceStoreId:option.store.id,sourceLocation:option.store.location,sourceState:option.store.state,store:option.store.name,location:option.store.location}:order);
    write('orders',orders);write('local:orders',orders);write('notifications',[{id:crypto.randomUUID(),title:'Global order assigned',message:`${id} was assigned to ${option.store.name}, ${option.store.location}.`,type:'order',orderId:id,read:false,createdAt:assignedAt},...read('notifications',[])]);return orders.find((order)=>order.id===id);
  },
  dispatchParcel(id, carrier, trackingNumber) {
    const current=read('orders',[]).find((order)=>order.id===id);
    if(!current||current.fulfillmentType!=='global'||current.globalApproval!=='Approved') throw new Error('Approve and transfer the global order before parcel dispatch.');
    if(!['Ready for Pickup','Confirmed','Preparing'].includes(current.status)) throw new Error('The source store must confirm and prepare this order first.');
    if(!carrier||!trackingNumber) throw new Error('Select a parcel carrier and enter its tracking number.');
    const dispatchedAt=new Date().toISOString();
    const orders=read('orders',[]).map((order)=>order.id===id?{...order,status:'Out for Delivery',parcel:{carrier,trackingNumber,status:'In Transit',dispatchedAt}}:order);
    write('orders',orders);write('local:orders',orders);return orders.find((order)=>order.id===id);
  },
  updateParcelStatus(id, status) {
    const allowed=['Ready for Dispatch','In Transit','Delivered','Delivery Exception'];
    if(!allowed.includes(status)) throw new Error('Invalid parcel status.');
    const orders=read('orders',[]).map((order)=>order.id===id?{...order,status:status==='Delivered'?'Delivered':order.status,parcel:{...order.parcel,status,updatedAt:new Date().toISOString()},...(status==='Delivered'?{deliveredAt:new Date().toISOString()}: {})}:order);
    write('orders',orders);write('local:orders',orders);return orders.find((order)=>order.id===id);
  },
  updateStatus(id, status) {
    const refundableStatuses = ['CANCELLED', 'Cancelled', 'Returned'];
    const transitions = {
      Pending:['Confirmed','Cancelled'],
      Confirmed:['Preparing','Cancelled'],
      Preparing:['Ready for Pickup','Cancelled'],
      'Ready for Pickup':['Picked Up','Out for Delivery','Cancelled'],
      'Picked Up':['Out for Delivery','Cancelled'],
      'Out for Delivery':['DELIVERED','Cancelled'],
      Delivered:['Returned'],
      CREATED:['CONFIRMED','CANCELLED'],
      CONFIRMED:['PROCESSING','CANCELLED'],
      PROCESSING:['SHIPPED','CANCELLED'],
      SHIPPED:['DELIVERED','CANCELLED'],
      DELIVERED:[],
      CANCELLED:[],
    };
    const current = read('orders', []).find((order) => order.id === id);
    if (!current) throw new Error('Order not found.');
    if (status === 'Delivered') throw new Error('Delivery can only be confirmed with the customer OTP.');
    if (current.status !== status && !transitions[current.status]?.includes(status)) throw new Error(`Move the order from ${current.status} through the next delivery stage first.`);
    const deliveryOtp = current.deliveryOtp || String(Math.floor(100000 + Math.random() * 900000));
    const orders = read('orders', []).map((order) => {
      if (order.id !== id) return order;
      const shouldRefund = refundableStatuses.includes(status) && order.paymentMethod !== 'cod' && ['SUCCESS', 'PAID', 'Paid'].some((value) => order.paymentStatus?.startsWith(value));
      return {
        ...order,
        deliveryOtp,
        status,
        fulfillment: order.fulfillment ? {
          ...order.fulfillment,
          status: status === 'CONFIRMED' ? 'ALLOCATED' : status === 'PROCESSING' ? 'PACKING' : status === 'SHIPPED' ? 'READY_TO_SHIP' : status === 'DELIVERED' ? 'DELIVERED' : status === 'CANCELLED' ? 'CANCELLED' : order.fulfillment.status,
          updatedAt: new Date().toISOString(),
        } : order.fulfillment,
        shipment: order.shipment ? {
          ...order.shipment,
          status: status === 'Picked Up' ? 'IN_TRANSIT' : status === 'Out for Delivery' ? 'OUT_FOR_DELIVERY' : status === 'SHIPPED' ? 'IN_TRANSIT' : status === 'DELIVERED' ? 'DELIVERED' : status === 'CANCELLED' ? 'CANCELLED' : order.shipment.status,
          shippedAt: status === 'SHIPPED' ? new Date().toISOString() : order.shipment.shippedAt,
          deliveredAt: status === 'DELIVERED' ? new Date().toISOString() : order.shipment.deliveredAt,
          updatedAt: new Date().toISOString(),
        } : order.shipment,
        trackingEvents: [...(order.trackingEvents || []), { id:crypto.randomUUID(), status, description:`Order ${status}`, location:order.sourceLocation || order.location || '', eventTime:new Date().toISOString() }],
        ...(shouldRefund ? {
          paymentStatus: 'Refunded (local demo)',
          refund: { id: `rfnd_demo_${Date.now()}`, amount: order.total, status: 'Processed', processedAt: new Date().toISOString() },
        } : {}),
      };
    });
    write('orders', orders);
    write('local:orders', orders);
    const notifications = read('notifications', []);
    const updated = orders.find((order) => order.id === id);
    const otpMessage = ['Out for Delivery', 'SHIPPED'].includes(status) ? ` Your delivery OTP is ${deliveryOtp}. Share it only after receiving your order.` : '';
    write('notifications', [{ id: crypto.randomUUID(), title: `Order ${status}`, subject:`Order ${status}`, message: `${id} is now ${status}.${otpMessage}`, type: 'order', notificationType:'ORDER_STATUS_UPDATED', channel:'PUSH', status:'SENT', orderId:id, customerId:updated?.customer?.id, recipient:updated?.customer?.phone || updated?.customer?.email || '', read: false, sentAt:new Date().toISOString(), createdAt: new Date().toISOString() }, ...notifications]);
    return orders.find((order) => order.id === id);
  },
  updateDeliveryStage(id, status, description = '') {
    const allowed = ['Picked Up', 'Out for Delivery', 'DELIVERED'];
    if (!allowed.includes(status)) throw new Error('Invalid delivery stage.');
    const current = read('orders', []).find((order) => order.id === id);
    if (!current) throw new Error('Order not found.');
    if (!current.deliveryPartnerId) throw new Error('Assign a delivery partner before changing delivery stages.');
    if (['DELIVERED', 'CANCELLED', 'Delivered', 'Cancelled'].includes(current.status)) throw new Error('This delivery is already finalized.');
    const now = new Date().toISOString();
    const deliveryOtp = current.deliveryOtp || String(Math.floor(100000 + Math.random() * 900000));
    const shipmentStatus = status === 'Picked Up' ? 'IN_TRANSIT' : status === 'Out for Delivery' ? 'OUT_FOR_DELIVERY' : 'DELIVERED';
    const fulfillmentStatus = status === 'DELIVERED' ? 'DELIVERED' : 'SHIPPED';
    const orders = read('orders', []).map((order) => order.id === id ? {
      ...order,
      deliveryOtp,
      status,
      deliveryAssignmentStatus: status === 'DELIVERED' ? 'DELIVERED' : 'IN_PROGRESS',
      fulfillment: order.fulfillment ? { ...order.fulfillment, status:fulfillmentStatus, updatedAt:now } : order.fulfillment,
      shipment: order.shipment ? {
        ...order.shipment,
        status: shipmentStatus,
        shippedAt: order.shipment.shippedAt || now,
        deliveredAt: status === 'DELIVERED' ? now : order.shipment.deliveredAt,
        updatedAt: now,
      } : order.shipment,
      trackingEvents: [...(order.trackingEvents || []), { id:crypto.randomUUID(), status:shipmentStatus, description:description || `Delivery ${status}`, location:status === 'Picked Up' ? order.sourceLocation || order.location || '' : order.destinationLocation || order.checkout?.deliveryAddress || order.location || '', eventTime:now }],
      ...(status === 'DELIVERED' ? { deliveredAt:now, deliveryOtpVerified:true } : {}),
    } : order);
    write('orders', orders);
    write('local:orders', orders);
    const updated = orders.find((order) => order.id === id);
    const otpMessage = status === 'Out for Delivery' ? ` Your delivery OTP is ${deliveryOtp}. Share it only after receiving your order.` : '';
    write('notifications', [{ id:crypto.randomUUID(), title:`Delivery ${status}`, subject:`Delivery ${status}`, message:`${id}: Delivery ${status}.${otpMessage}`, type:'order', notificationType:status === 'DELIVERED' ? 'SHIPMENT_DELIVERED' : 'ORDER_STATUS_UPDATED', channel:'PUSH', status:'SENT', orderId:id, customerId:updated?.customer?.id, recipient:updated?.customer?.phone || updated?.customer?.email || '', read:false, sentAt:now, createdAt:now }, ...read('notifications', [])]);
    return updated;
  },
  cancelDelivery(id, reason = '') {
    const current = read('orders', []).find((order) => order.id === id);
    if (!current) throw new Error('Order not found.');
    if (!current.deliveryPartnerId) throw new Error('Only assigned deliveries can be cancelled from the delivery portal.');
    if (['DELIVERED', 'Delivered', 'CANCELLED', 'Cancelled'].includes(current.status)) throw new Error('Completed or cancelled deliveries cannot be cancelled again.');
    const note = String(reason || '').trim();
    if (!note) throw new Error('Cancellation reason is required.');
    const cancelledAt = new Date().toISOString();
    const orders = read('orders', []).map((order) => order.id === id ? {
      ...order,
      status: 'CANCELLED',
      deliveryAssignmentStatus: 'CANCELLED',
      deliveryCancelReason: note,
      deliveryCancelledAt: cancelledAt,
      fulfillment: order.fulfillment ? { ...order.fulfillment, status:'CANCELLED', updatedAt:cancelledAt } : order.fulfillment,
      shipment: order.shipment ? { ...order.shipment, status:'CANCELLED', updatedAt:cancelledAt } : order.shipment,
      trackingEvents: [...(order.trackingEvents || []), { id:crypto.randomUUID(), status:'CANCELLED', description:`Delivery cancelled: ${note}`, location:order.destinationLocation || order.location || '', eventTime:cancelledAt }],
    } : order);
    write('orders', orders);
    write('local:orders', orders);
    const updated = orders.find((order) => order.id === id);
    write('notifications', [{ id:crypto.randomUUID(), title:'Delivery Cancelled', subject:'Delivery Cancelled', message:`${id} delivery was cancelled. Reason: ${note}`, type:'order', notificationType:'ORDER_STATUS_UPDATED', channel:'PUSH', status:'SENT', orderId:id, customerId:updated?.customer?.id, recipient:updated?.customer?.phone || updated?.customer?.email || '', read:false, sentAt:cancelledAt, createdAt:cancelledAt }, ...read('notifications', [])]);
    return updated;
  },
  updateServiceWorkflow(id, action) {
    const current = read('orders', []).find((order) => order.id === id);
    if (!current) throw new Error('Order not found.');
    if (['DELIVERED', 'CANCELLED'].includes(current.status)) throw new Error('Completed or cancelled orders cannot be updated.');
    const now = new Date().toISOString();
    const deliveryOtp = current.deliveryOtp || String(Math.floor(100000 + Math.random() * 900000));
    const workflow = {
      CONFIRM: { orderStatus:'CONFIRMED', fulfillment:'ALLOCATED', shipment:'CREATED', label:'Order confirmed' },
      PACKING: { orderStatus:'PROCESSING', fulfillment:'PACKING', shipment:'PREPARING', label:'Items are being packed' },
      READY: { orderStatus:'Ready for Pickup', fulfillment:'READY_TO_SHIP', shipment:'READY_FOR_PICKUP', label:'Order is ready for dispatch' },
      SHIP: { orderStatus:'SHIPPED', fulfillment:'SHIPPED', shipment:'IN_TRANSIT', label:'Order shipped', otp:true },
      OUT_FOR_DELIVERY: { orderStatus:'SHIPPED', fulfillment:'OUT_FOR_DELIVERY', shipment:'OUT_FOR_DELIVERY', label:'Order is out for delivery', otp:true },
      DELIVER: { orderStatus:'DELIVERED', fulfillment:'DELIVERED', shipment:'DELIVERED', label:'Order delivered' },
    }[action];
    if (!workflow) throw new Error('Unsupported service workflow action.');
    const orders = read('orders', []).map((order) => order.id === id ? {
      ...order,
      deliveryOtp,
      status: workflow.orderStatus,
      fulfillment: order.fulfillment ? { ...order.fulfillment, status:workflow.fulfillment, updatedAt:now } : order.fulfillment,
      shipment: order.shipment ? { ...order.shipment, status:workflow.shipment, shippedAt:['SHIP','OUT_FOR_DELIVERY'].includes(action) ? now : order.shipment.shippedAt, deliveredAt:action==='DELIVER' ? now : order.shipment.deliveredAt, updatedAt:now } : order.shipment,
      trackingEvents: [...(order.trackingEvents || []), { id:crypto.randomUUID(), status:workflow.fulfillment, description:workflow.label, location:order.sourceLocation || order.location || '', eventTime:now }],
      ...(action === 'DELIVER' ? { deliveredAt:now, deliveryOtpVerified:true } : {}),
    } : order);
    write('orders', orders);
    write('local:orders', orders);
    const updated = orders.find((order) => order.id === id);
    const otpMessage = workflow.otp ? ` Your delivery OTP is ${deliveryOtp}. Share it only after receiving your order.` : '';
    write('notifications', [{ id:crypto.randomUUID(), title:workflow.label, subject:workflow.label, message:`${id}: ${workflow.label}.${otpMessage}`, type:'order', notificationType:action==='DELIVER'?'SHIPMENT_DELIVERED':'ORDER_STATUS_UPDATED', channel:'PUSH', status:'SENT', orderId:id, customerId:updated?.customer?.id, recipient:updated?.customer?.phone || updated?.customer?.email || '', read:false, sentAt:now, createdAt:now }, ...read('notifications', [])]);
    return updated;
  },
  syncBackendWorkflow(backendOrder = {}) {
    const now = new Date().toISOString();
    const orders = read('orders', []);
    const backendNames = new Set((backendOrder.items || []).map((item) => String(item.title || item.productName || item.name || '').trim().toLowerCase()).filter(Boolean));
    const sameText = (left, right) => String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();
    const status = backendOrder.status || 'CONFIRMED';
    const fallbackFulfillmentStatus = status === 'CONFIRMED' ? 'ALLOCATED' : status === 'PROCESSING' ? 'PACKING' : status === 'SHIPPED' ? 'SHIPPED' : status === 'DELIVERED' ? 'DELIVERED' : 'PENDING';
    const fallbackShipmentStatus = status === 'SHIPPED' ? 'IN_TRANSIT' : status === 'DELIVERED' ? 'DELIVERED' : 'CREATED';
    let changed = false;
    const nextOrders = orders.map((order) => {
      const sameStore = sameText(order.storeId, backendOrder.storeId)
        || sameText(order.sourceStoreId, backendOrder.storeId)
        || sameText(order.store, backendOrder.store)
        || sameText(order.sourceStore, backendOrder.sourceStore);
      const sameOrder = sameText(order.id, backendOrder.id)
        || sameText(order.id, backendOrder.orderNumber)
        || sameText(order.backendOrderId, backendOrder.id)
        || sameText(order.backendOrderNumber, backendOrder.orderNumber);
      const sameItems = backendNames.size && (order.items || []).some((item) => backendNames.has(String(item.title || item.productName || item.name || '').trim().toLowerCase()));
      if (!sameOrder && !(sameStore && sameItems)) return order;
      changed = true;
      return {
        ...order,
        backendOrderId: backendOrder.id || order.backendOrderId,
        backendOrderNumber: backendOrder.orderNumber || order.backendOrderNumber,
        status,
        fulfillment: backendOrder.fulfillment ? { ...backendOrder.fulfillment, orderId:order.id } : order.fulfillment ? { ...order.fulfillment, status:fallbackFulfillmentStatus, updatedAt:now } : order.fulfillment,
        shipment: backendOrder.shipment ? { ...backendOrder.shipment, orderId:order.id } : order.shipment ? { ...order.shipment, status:fallbackShipmentStatus, updatedAt:now } : order.shipment,
        trackingEvents: backendOrder.trackingEvents?.length
          ? backendOrder.trackingEvents
          : [...(order.trackingEvents || []), { id:crypto.randomUUID(), status, description:`Order ${status}`, location:order.sourceLocation || order.location || '', eventTime:now }],
      };
    });
    if (!changed) return null;
    write('orders', nextOrders);
    write('local:orders', nextOrders);
    const updatedOrders = nextOrders.filter((order) => sameText(order.backendOrderId, backendOrder.id) || sameText(order.backendOrderNumber, backendOrder.orderNumber) || ((order.items || []).some((item) => backendNames.has(String(item.title || item.productName || item.name || '').trim().toLowerCase())) && (sameText(order.storeId, backendOrder.storeId) || sameText(order.sourceStoreId, backendOrder.storeId))));
    write('notifications', [
      ...updatedOrders.map((order) => ({ id:crypto.randomUUID(), title:`Order ${status}`, subject:`Order ${status}`, message:`${order.id} is now ${status}.`, type:'order', notificationType:'ORDER_STATUS_UPDATED', channel:'PUSH', status:'SENT', orderId:order.id, customerId:order.customer?.id, recipient:order.customer?.phone || order.customer?.email || '', read:false, sentAt:now, createdAt:now })),
      ...read('notifications', []),
    ]);
    return updatedOrders;
  },
  verifyDeliveryOtp(id, otp) {
    const current = read('orders', []).find((order) => order.id === id);
    if (!current) throw new Error('Order not found.');
    if (current.status !== 'Out for Delivery') throw new Error('The order must be out for delivery before OTP verification.');
    if (current.deliveryOtpVerified) throw new Error('This delivery OTP has already been used.');
    if (String(otp).trim() !== current.deliveryOtp) throw new Error('Incorrect delivery OTP. Ask the customer for the latest OTP notification.');
    const deliveredAt = new Date().toISOString();
    const orders = read('orders', []).map((order) => order.id === id ? { ...order, status:'DELIVERED', deliveryOtpVerified:true, deliveredAt, fulfillment:order.fulfillment?{...order.fulfillment,status:'DELIVERED',updatedAt:deliveredAt}:order.fulfillment, shipment:order.shipment?{...order.shipment,status:'DELIVERED',deliveredAt,updatedAt:deliveredAt}:order.shipment, trackingEvents:[...(order.trackingEvents||[]),{id:crypto.randomUUID(),status:'DELIVERED',description:'Order delivered after OTP verification',location:order.destinationLocation||order.location||'',eventTime:deliveredAt}] } : order);
    write('orders', orders);
    write('local:orders', orders);
    const notifications = read('notifications', []);
    write('notifications', [{ id:crypto.randomUUID(),title:'Order Delivered',subject:'Order Delivered',message:`${id} was delivered successfully after OTP verification.`,type:'order',notificationType:'SHIPMENT_DELIVERED',channel:'PUSH',status:'SENT',orderId:id,read:false,sentAt:deliveredAt,createdAt:deliveredAt },...notifications]);
    return orders.find((order) => order.id === id);
  },
};

export const deliveryPartnerStore = {
  list: () => read('local:delivery', []),
  setAvailability(id, active) {
    const status = active ? 'Active' : 'Inactive';
    const updated = collectionStore.update('delivery', id, { status, active });
    const currentUser = read('user', null);
    if (currentUser?.id === id) write('user', { ...currentUser, status, active });
    return delay(updated);
  },
  authenticate(vehicleNumber, password) {
    const vehicle = String(vehicleNumber).trim().toUpperCase();
    const partner = read('local:delivery', []).find((item) => String(item.vehicleNumber || item.vehicle).trim().toUpperCase() === vehicle && item.status !== 'Blocked');
    if (!partner || partner.password !== password) throw new Error('Incorrect vehicle number or password.');
    return delay({ user:{ id:partner.id,name:partner.name,email:partner.email || '',phone:partner.phone,location:partner.location || '',store:partner.store || '',storeId:partner.storeId || '',status:partner.status || 'Active',active:partner.active !== false,vehicleNumber:partner.vehicleNumber || partner.vehicle,vehicleType:partner.vehicleType || '',role:'delivery-partner',mustChangePassword:Boolean(partner.mustChangePassword) }, token:`local-delivery-${partner.id}` });
  },
  updateProfile(id, profile = {}) {
    const partner = read('local:delivery', []).find((item) => item.id === id);
    if (!partner) throw new Error('Delivery partner profile not found.');
    const patch = {
      name: profile.name ?? partner.name,
      phone: profile.phone ?? partner.phone,
      email: profile.email ?? partner.email,
      vehicleNumber: String(profile.vehicleNumber ?? partner.vehicleNumber ?? partner.vehicle ?? '').trim().toUpperCase(),
      vehicleType: profile.vehicleType ?? partner.vehicleType,
      address: profile.address ?? partner.address,
      location: profile.location ?? partner.location,
      emergencyContact: profile.emergencyContact ?? partner.emergencyContact,
      licenseNumber: profile.licenseNumber ?? partner.licenseNumber,
    };
    const updated = collectionStore.update('delivery', id, patch);
    const currentUser = read('user', null);
    if (currentUser?.id === id) write('user', { ...currentUser, ...patch, vehicleNumber: patch.vehicleNumber });
    return delay(updated);
  },
  changePassword(id, currentPassword, newPassword) {
    const partner = read('local:delivery', []).find((item) => item.id === id);
    if (!partner || partner.password !== currentPassword) throw new Error('Current password is incorrect.');
    if (String(newPassword).length < 6) throw new Error('New password must contain at least 6 characters.');
    collectionStore.update('delivery', id, { password:newPassword,mustChangePassword:false,passwordChangedAt:new Date().toISOString() });
    const currentUser = read('user', null);
    if (currentUser?.id === id) write('user', { ...currentUser,mustChangePassword:false });
    return true;
  },
};

const demoStaffAccounts = [
  ['admin@metaarch.local','Super Admin','super-admin','',''],
  ['globaladmin@metaarch.local','Global Admin','global-admin','',''],
  ['locationadmin@metaarch.local','Hyderabad Location Admin','location-admin','Hyderabad',''],
  ['locationadminhyd2@metaarch.local','Hyderabad Deputy Admin','location-admin','Hyderabad',''],
  ['locationadminvja@metaarch.local','Vijayawada Location Admin','location-admin','Vijayawada',''],
  ['locationadminvja2@metaarch.local','Vijayawada Deputy Admin','location-admin','Vijayawada',''],
  ['locationadminchn@metaarch.local','Chennai Location Admin','location-admin','Chennai',''],
  ['locationadminchn2@metaarch.local','Chennai Deputy Admin','location-admin','Chennai',''],
  ['locationadminblr@metaarch.local','Bengaluru Location Admin','location-admin','Bengaluru',''],
  ['locationadminblr2@metaarch.local','Bengaluru Deputy Admin','location-admin','Bengaluru',''],
  ['storemanager@metaarch.local','Sravani Gachibowli','store-manager','Hyderabad','Gachibowli Fresh Hub'],
  ['storemanagerhydmain@metaarch.local','Ramesh HYD Main','store-manager','Hyderabad','Hyderabad Main Store'],
  ['storemanagerbanjara@metaarch.local','Mahesh Banjara','store-manager','Hyderabad','Banjara Hills Pickle House'],
  ['storemanagersecunderabad@metaarch.local','Anil Secunderabad','store-manager','Hyderabad','Secunderabad Daily Foods'],
  ['storemanagerbenzcircle@metaarch.local','Lakshmi Benz Circle','store-manager','Vijayawada','Benz Circle Fresh Basket'],
  ['storemanagergovernorpet@metaarch.local','Ravi Governorpet','store-manager','Vijayawada','Governorpet Spice Store'],
  ['storemanagerporanki@metaarch.local','Sneha Poranki','store-manager','Vijayawada','Poranki Fresh Mart'],
  ['storemanagertnagar@metaarch.local','Arun T Nagar','store-manager','Chennai','T Nagar Family Foods'],
  ['storemanageradyar@metaarch.local','Divya Adyar','store-manager','Chennai','Adyar Organic Basket'],
  ['storemanagervelachery@metaarch.local','Karthik Velachery','store-manager','Chennai','Velachery Daily Foods'],
  ['storemanagerblr@metaarch.local','Kiran Koramangala','store-manager','Bengaluru','Koramangala Gourmet Mart'],
  ['storemanagerindiranagar@metaarch.local','Neha Indiranagar','store-manager','Bengaluru','Indiranagar Organic Foods'],
  ['storemanagerwhitefield@metaarch.local','Manoj Whitefield','store-manager','Bengaluru','Whitefield Fresh Basket'],
].map(([email,name,role,location,store])=>({id:email.split('@')[0],username:email.split('@')[0],email,name,role,location,store,storeId:{
  'Gachibowli Fresh Hub':'store-gachibowli',
  'Hyderabad Main Store':'india-store-1-1',
  'SR Nagar Store':'india-store-1-3',
  'Banjara Hills Pickle House':'store-banjara',
  'Secunderabad Daily Foods':'store-secunderabad',
  'Benz Circle Fresh Basket':'store-benzcircle',
  'Governorpet Spice Store':'store-governorpet',
  'Poranki Fresh Mart':'store-poranki',
  'T Nagar Family Foods':'store-tnagar',
  'Adyar Organic Basket':'store-adyar',
  'Velachery Daily Foods':'store-velachery',
  'Koramangala Gourmet Mart':'store-koramangala',
  'Indiranagar Organic Foods':'store-indiranagar',
  'Whitefield Fresh Basket':'store-whitefield',
}[store] || '',password:'admin123',status:'Active',active:true}));

export const staffProfileStore = {
  update(profile = {}, authenticatedUser = null) {
    const currentUser = authenticatedUser || read('user', null);
    if (!currentUser?.id) throw new Error('No staff user is signed in.');
    const staff = read('local:users', []);
    const existing = staff.find((item) => item.id === currentUser.id || item.email === currentUser.email || item.username === currentUser.username)
      || demoStaffAccounts.find((item) => item.id === currentUser.id || item.email === currentUser.email || item.username === currentUser.username)
      || currentUser;
    if (profile.newPassword) {
      if (!profile.currentPassword || existing.password !== profile.currentPassword) throw new Error('Current password is incorrect.');
      if (String(profile.newPassword).length < 6) throw new Error('New password must contain at least 6 characters.');
      if (profile.newPassword !== profile.confirmPassword) throw new Error('New passwords do not match.');
    }
    const updatedAccount = {
      ...existing,
      name: profile.name ?? existing.name,
      email: profile.email ?? existing.email,
      mobile: profile.mobile ?? existing.mobile,
      phone: profile.phone ?? existing.phone,
      location: profile.location ?? existing.location,
      store: profile.store ?? existing.store,
      storeId: profile.storeId ?? existing.storeId,
      ...(profile.newPassword ? { password: profile.newPassword, mustChangePassword: false, passwordChangedAt: new Date().toISOString() } : {}),
      updatedAt: new Date().toISOString(),
    };
    write('local:users', staff.some((item) => item.id === updatedAccount.id)
      ? staff.map((item) => item.id === updatedAccount.id ? updatedAccount : item)
      : [updatedAccount, ...staff]);
    if (profile.storePatch?.id) {
      const stores = read('local:stores', []);
      write('local:stores', stores.map((store) => store.id === profile.storePatch.id ? { ...store, ...profile.storePatch, updatedAt: new Date().toISOString() } : store));
    }
    const user = {
      ...currentUser,
      name: updatedAccount.name,
      email: updatedAccount.email,
      mobile: updatedAccount.mobile,
      phone: updatedAccount.phone,
      location: updatedAccount.location || '',
      store: updatedAccount.store || '',
      storeId: updatedAccount.storeId || currentUser.storeId || '',
      mustChangePassword: Boolean(updatedAccount.mustChangePassword),
    };
    write('user', user);
    write('local:audit logs', [{ id:crypto.randomUUID(),name:'Updated staff profile',description:user.name || user.id,createdAt:new Date().toISOString() }, ...read('local:audit logs', [])]);
    return delay(user);
  },
};

export const staffAuthStore = {
  authenticate(email, password, requestedRole) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const localAccounts = read('local:users', []);
    const account = [...localAccounts, ...demoStaffAccounts].find((item) => [item.email,item.username,item.id].some((value)=>String(value || '').toLowerCase() === normalizedEmail) && item.status !== 'Blocked');
    if (!account || account.password !== password || (requestedRole && account.role !== requestedRole)) throw new Error('Incorrect email, password, or portal selection.');
    const deliveryProfile = account.role === 'delivery-partner'
      ? read('local:delivery', []).find((item) => [item.id,item.username,item.email].some((value)=>String(value || '').toLowerCase() === normalizedEmail || String(value || '').toLowerCase() === String(account.id || '').toLowerCase()))
      : null;
    const user = { ...deliveryProfile, id:account.id,username:account.username,name:account.name,email:account.email,role:account.role,location:account.location || deliveryProfile?.location || '',store:account.store || deliveryProfile?.store || '',storeId:account.storeId || deliveryProfile?.storeId || '' };
    return delay({ user, token:`local-staff-${account.id}-${Date.now()}` });
  },
};

const applyOwnershipScope=(name,data)=>{
  if(!['banners','coupons'].includes(name)) return data;
  const actor=read('user',null);if(!actor?.role)return data;
  if(actor.role==='global-admin') return {...data,scope:'Global',location:'',store:'',assignedBy:actor.id};
  if(actor.role==='location-admin'){const store=data.targetStore||data.store||'';return {...data,scope:store?'Store':'Location',location:actor.location,store,targetStore:store,assignedBy:actor.id};}
  if(actor.role==='store-manager') return {...data,scope:'Store',location:actor.location,store:actor.store,assignedBy:actor.id};
  return data;
};

export const collectionStore = {
  list: (name) => read(`local:${name}`, []),
  add(name, data) {
    const record = { ...applyOwnershipScope(name,data), id: crypto.randomUUID(), createdAt: new Date().toISOString(), active: true };
    write(`local:${name}`, [record, ...read(`local:${name}`, [])]);
    write('local:audit logs', [{ id:crypto.randomUUID(),name:`Created ${name}`,description:record.name || record.id,createdAt:new Date().toISOString() }, ...read('local:audit logs', [])]);
    return record;
  },
  update(name, id, data) {
    const scopedData=applyOwnershipScope(name,data);
    const records = read(`local:${name}`, []).map((record) => record.id === id ? { ...record, ...scopedData, updatedAt: new Date().toISOString() } : record);
    write(`local:${name}`, records);
    write('local:audit logs', [{ id:crypto.randomUUID(),name:`Updated ${name}`,description:id,createdAt:new Date().toISOString() }, ...read('local:audit logs', [])]);
    return records.find((record) => record.id === id);
  },
  upsert(name, data) {
    const scopedData = applyOwnershipScope(name, data);
    const records = read(`local:${name}`, []);
    const existing = records.some((record) => record.id === scopedData.id);
    const record = { ...scopedData, id:scopedData.id || crypto.randomUUID(), active:scopedData.active !== false, updatedAt:new Date().toISOString(), ...(scopedData.createdAt ? {} : { createdAt:new Date().toISOString() }) };
    write(`local:${name}`, existing ? records.map((item) => item.id === record.id ? { ...item, ...record } : item) : [record, ...records]);
    write('local:audit logs', [{ id:crypto.randomUUID(),name:`Saved ${name}`,description:record.name || record.id,createdAt:new Date().toISOString() }, ...read('local:audit logs', [])]);
    return record;
  },
  remove(name, id) {
    const records = read(`local:${name}`, []).filter((record) => record.id !== id);
    write(`local:${name}`, records);
    write('local:audit logs', [{ id:crypto.randomUUID(),name:`Deleted ${name}`,description:id,createdAt:new Date().toISOString() }, ...read('local:audit logs', [])]);
    return records;
  },
  replace(name, records) {
    return write(`local:${name}`, records);
  },
};

export const subscribeToLocalData = (listener) => {
  const localHandler = (event) => listener(event.detail);
  const storageHandler = (event) => listener({ key: event.key });
  window.addEventListener('local-data-change', localHandler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener('local-data-change', localHandler);
    window.removeEventListener('storage', storageHandler);
  };
};

export const notificationStore = {
  list: () => read('notifications', []),
  add(notification) {
    const item = { id: crypto.randomUUID(), read: false, createdAt: new Date().toISOString(), ...notification };
    write('notifications', [item, ...read('notifications', [])]);
    return item;
  },
  update(id, notification) {
    return write('notifications', read('notifications', []).map((item) => item.id === id ? { ...item, ...notification, updatedAt:new Date().toISOString() } : item));
  },
  markRead(id) {
    return write('notifications', read('notifications', []).map((item) => item.id === id ? { ...item, read: true } : item));
  },
  remove(id) {
    return write('notifications', read('notifications', []).filter((item) => item.id !== id));
  },
  clear: () => write('notifications', []),
};

export const supportStore = {
  tickets: () => read('supportTickets', []),
  createTicket(ticket) {
    const item = { id: `TKT-${Date.now()}`, status: 'Open', createdAt: new Date().toISOString(), ...ticket };
    write('supportTickets', [item, ...read('supportTickets', [])]);
    return item;
  },
  messages: () => read('chatMessages', []),
  sendMessage(text, sender = 'customer') {
    const item = { id: crypto.randomUUID(), text, sender, createdAt: new Date().toISOString() };
    write('chatMessages', [...read('chatMessages', []), item]);
    return item;
  },
};

export const loyaltyStore = {
  get() {
    return read('loyalty', { points: 100, referralCode: 'PICKLES100', vouchers: [], referrals: 0 });
  },
  redeem(points) {
    const current = this.get();
    if (current.points < points) throw new Error('Not enough reward points.');
    const voucher = { id: crypto.randomUUID(), code: `GIFT${Date.now().toString().slice(-5)}`, value: points / 10 };
    const next = { ...current, points: current.points - points, vouchers: [voucher, ...current.vouchers] };
    write('loyalty', next);
    return next;
  },
};
