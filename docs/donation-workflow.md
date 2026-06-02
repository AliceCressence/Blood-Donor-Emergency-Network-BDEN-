# Donation Workflow

This document explains how BDEN moves from a hospital need to a donor action, and finally to a verified donation record.

## Matching Rules

Emergency requests and campaigns reach donors when the donor profile satisfies the matching conditions below.

For emergency requests:

- The hospital request has a valid blood type, latitude, and longitude.
- Donor blood type is compatible with the requested patient blood type.
- Donor availability is `AVAILABLE`.
- Donor blood type is verified.
- Donor profile has latitude and longitude.
- Donor is within the donor-service matching radius (`DEFAULT_MATCHING_RADIUS_KM`, capped by `MAX_MATCHING_RADIUS_KM`).

For campaigns:

- Campaign must be approved and public: `APPROVED` or `ONGOING`.
- Campaign end date must not have passed.
- If the campaign lists blood types, donor blood type must be one of them. If the list is empty, all blood types are welcome.
- Nearby campaign matching uses the same donor-service internal nearby endpoint and radius logic.

The request-service stores matching results for emergency requests. Campaign approval publishes the list of nearby donors through the shared Redis event channel.

## In-App Notifications

Notifications are handled by notification-service and consumed from Redis channel `bden.events`.

Current donor-facing events:

- `EMERGENCY_REQUEST_CREATED`: sent to matched donors when request-service finds compatible nearby donors.
- `CAMPAIGN_APPROVED`: sent to nearby donors after an admin approves a campaign.

Current hospital-facing events:

- `DONOR_ACCEPTED_REQUEST`: sent when a donor taps `I can donate` on an emergency request.
- `DONOR_INTERESTED_CAMPAIGN`: sent when a donor taps `I am interested` on a campaign.

If a request has no matched donors because location or donor profile data is missing, a generic event may still be published, but no donor-specific in-app notification will be created. In practice, donor notifications require real donor profile location, verified blood type, and availability.

## Donor Actions

From the donor nearby needs view:

- Emergency request: donor can accept or decline.
- Campaign: donor can register interest.
- Screening center: donor can view details and directions only.

The emergency request CTA is blood-type aware:

- If the donor's registered blood type is compatible with the request, the donor can opt in with `I can donate`.
- If the donor's registered blood type is not compatible, the opt-in CTA is hidden and the drawer explains why.
- If the donor's blood type is unset or unknown, the donor can still say they are willing, but the UI clearly explains that the facility must screen and confirm compatibility before any sample is taken.

Emergency request response payload:

```json
{
  "donor_id": "uuid",
  "status": "ACCEPTED",
  "name": "Jane Donor",
  "blood_type": "O+",
  "phone": "+237..."
}
```

Valid emergency response statuses are:

- `ACCEPTED`
- `DECLINED`
- `UNAVAILABLE`
- `NO_RESPONSE`

Campaign interest does not create a donation record. It only tells the facility that the donor may attend.

## Hospital Follow-Up

Hospitals can now inspect donor responses from the emergency request page:

- `View donors` loads responses for that request.
- Accepted responses can be verified with `Record donation`.
- Recording a donation updates the donor's donation history in donor-service.
- Recording an emergency donation also marks the request as fulfilled in the hospital UI.

Hospitals can inspect campaign interest from the campaign manager:

- `View donors` loads campaign interests.
- `Record donation` records the donation against that campaign.
- Campaign progress is incremented after the donation is recorded.

The MVP campaign interest list only exposes donor user IDs. A future internal donor lookup endpoint should enrich this with donor name, phone, eligibility, and blood type without duplicating donor data inside campaign-service.

## Verified Donation Records

Donation records are owned by donor-service.

Only verified hospitals and admins can call:

```text
POST /api/donors/donations/record/
```

Payload:

```json
{
  "donor_user_id": "uuid",
  "source_type": "EMERGENCY_REQUEST",
  "source_id": "uuid",
  "facility_name": "Central Hospital",
  "facility_user_id": "uuid",
  "volume_ml": 450,
  "donation_date": "2026-06-02",
  "notes": "Verified at triage desk"
}
```

Allowed `source_type` values:

- `EMERGENCY_REQUEST`
- `CAMPAIGN`
- `INDEPENDENT`

Donation constraints:

- Minimum volume is 350ml.
- Donor must be eligible based on the 90-day interval rule.
- Donor history, total donations, total volume, and next eligibility are updated after a successful record.

## Product Notes

BDEN does not use a bid-style model for requests. Blood donation is time-sensitive and safety-sensitive, so the donor action is intentionally simple: accept, decline, or register campaign interest. The facility remains responsible for medical verification and final donation recording.

Banner ads on the donor dashboard are displayed as flexible landscape media. They are still designed for 16:x artwork, but the dashboard slot adapts to wider ratios such as 16:9, 16:5, or 16:4.
