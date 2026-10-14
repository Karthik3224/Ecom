package com.metaarch.customerprofile.address;
import java.util.*; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.server.ResponseStatusException; import static org.springframework.http.HttpStatus.NOT_FOUND;
@Service
public class CustomerAddressService {
 private final CustomerAddressRepository addresses; public CustomerAddressService(CustomerAddressRepository r){addresses=r;}
 @Transactional(readOnly=true) public List<AddressResponse> list(String user){return addresses.findAllByUsernameOrderByDefaultAddressDescCreatedAtAsc(user).stream().map(AddressResponse::from).toList();}
 @Transactional public AddressResponse create(String user,AddressRequest r){
  CustomerAddress a=new CustomerAddress(user);
  apply(a,r);
  if(addresses.countByUsername(user)==0||r.defaultAddress()) makeOnlyDefault(user,a);
  return AddressResponse.from(addresses.save(a));
 }
 @Transactional public AddressResponse update(String user,UUID id,AddressRequest r){
  CustomerAddress a=find(user,id);
  apply(a,r);
  if(r.defaultAddress()) makeOnlyDefault(user,a);
  return AddressResponse.from(addresses.save(a));
 }
 @Transactional public AddressResponse setDefault(String user,UUID id){CustomerAddress a=find(user,id); makeOnlyDefault(user,a); return AddressResponse.from(addresses.save(a));}
 @Transactional public void delete(String user,UUID id){CustomerAddress a=find(user,id); boolean wasDefault=a.isDefaultAddress(); addresses.delete(a); addresses.flush(); if(wasDefault){addresses.findAllByUsernameOrderByDefaultAddressDescCreatedAtAsc(user).stream().findFirst().ifPresent(next->{next.setDefaultAddress(true);addresses.save(next);});}}
 private CustomerAddress find(String u,UUID id){return addresses.findByIdAndUsername(id,u).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"Address not found"));}
 private void makeOnlyDefault(String u,CustomerAddress selected){addresses.findAllByUsernameOrderByDefaultAddressDescCreatedAtAsc(u).forEach(a->{if(!a.getId().equals(selected.getId()))a.setDefaultAddress(false);});selected.setDefaultAddress(true);}
 private void apply(CustomerAddress a,AddressRequest r){a.setType(r.type().trim());a.setAddress(r.address().trim());a.setPhone(r.phone().trim());a.setHouseNumber(r.houseNumber().trim());a.setFloor(r.floor().trim());a.setLandmark(blank(r.landmark()));a.setLatitude(r.latitude());a.setLongitude(r.longitude());a.setStreet(blank(r.street()));a.setCity(blank(r.city()));a.setState(blank(r.state()));a.setPincode(blank(r.pincode()));a.setDefaultAddress(r.defaultAddress());}
 private String blank(String v){return v==null||v.isBlank()?null:v.trim();}
}
