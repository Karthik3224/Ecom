package com.metaarch.customerprofile.profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.NOT_FOUND;
@Service
public class CustomerProfileService {
  private final CustomerProfileRepository profiles;
  public CustomerProfileService(CustomerProfileRepository profiles) { this.profiles = profiles; }
  @Transactional(readOnly=true) public ProfileResponse get(String username) { return ProfileResponse.from(find(username)); }
  @Transactional public ProfileResponse upsert(String username, ProfileRequest request) { return upsert(username,request,null); }
  @Transactional public ProfileResponse upsert(String username, ProfileRequest request, java.util.UUID customerId) {
    CustomerProfile profile = profiles.findByUsername(username).orElseGet(() -> new CustomerProfile(username, request.name().trim(), request.phone().trim()));
    if (customerId != null && !profiles.findByUsername(username).isPresent()) profile.setId(customerId);
    profile.setName(request.name().trim()); profile.setPhone(request.phone().trim()); profile.setEmail(blankToNull(request.email()));
    profile.setGender(request.gender()); profile.setDateOfBirth(request.dateOfBirth()); profile.setPhoto(blankToNull(request.photo()));
    return ProfileResponse.from(profiles.save(profile));
  }
  @Transactional public void delete(String username) { profiles.delete(find(username)); }
  private CustomerProfile find(String username) { return profiles.findByUsername(username).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Customer profile not found")); }
  private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
