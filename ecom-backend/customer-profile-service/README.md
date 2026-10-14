# Customer Profile Service

Spring Boot service for authenticated customer profile data. It listens on port `8088` and uses the `customer_profiles` MySQL database.

## API

- `GET /api/v1/profiles/me` — read the profile identified by JWT `sub`
- `PUT /api/v1/profiles/me` — create or replace that profile
- `DELETE /api/v1/profiles/me` — delete that profile
- `GET /api/v1/profiles/{username}` — administrator lookup (`ROLE_ADMIN`)

Through the API gateway, prefix requests with `/customer-profile`.

Example request body:

```json
{
  "name": "Alice Doe",
  "phone": "+919876543210",
  "email": "alice@example.com",
  "gender": "FEMALE",
  "dateOfBirth": "1994-05-12",
  "photo": null
}
```

Run `mvn test` and `mvn package` from this directory. Build the JAR before building the Docker image.
