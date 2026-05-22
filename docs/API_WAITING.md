# Waiting API specification

Per product/TF requirements. Adjust `NEXT_PUBLIC_WAITING_PATH` if the server path differs.

## API name

`waiting`

## Method

`POST`

## URL

`{NEXT_PUBLIC_API_BASE_URL}/{NEXT_PUBLIC_WAITING_PATH}`

Default path segment: `waiting` (no leading slash in the env value).

Example: `https://api.example.com/waiting`

## Request headers

| Header | Value |
|--------|--------|
| `Content-Type` | `application/json` |

## Request body (JSON)

| Field | Type | Description |
|-------|------|-------------|
| `phone` | string | Customer contact, sent as exactly 11 digits without hyphens (e.g. `01000000000`). |
| `people` | number | Party size (integer, minimum 1). |
| `partySize` | number | **Sent by this client with the same value as `people`.** Matches the `partySize` field used in the admin waiting list (`WaitingManager` on `feature/add-reservation-management`). |

### Example

```json
{
  "phone": "01000000000",
  "people": 4,
  "partySize": 4
}
```

## Success response

HTTP status: `2xx`

Body (JSON object):

| Field | Type | Description |
|-------|------|-------------|
| `result` | boolean | `true` when the waiting request is accepted; `false` otherwise. |
| `message` | string | Optional failure message. When present with `result: false`, the client displays this message in the waiting form. |

### Example

```json
{
  "result": true
}
```

## Client behavior (this repository)

- The front end sends `phone`, `people`, and duplicate `partySize` (same as `people`) so payloads align with the admin waiting list model.
- The client treats the call as successful only when the parsed JSON indicates success: object with `result: true`, or legacy raw boolean `true` for backward compatibility.

## Error responses

Non-2xx HTTP status or JSON that does not indicate success is treated as failure in the UI (no waiting registration).

If the server returns a duplicate-phone failure, the client displays the server-provided message:

```json
{
  "result": false,
  "message": "이미 예약 등록한 전화번호입니다."
}
```
---

## Queue position lookup (optional backend)

Customers can check which position they are in the waiting queue (연번).

### API name

`waiting/position` (default path segment; override with `NEXT_PUBLIC_WAITING_POSITION_PATH`)

### Method

`POST`

### URL

`{NEXT_PUBLIC_API_BASE_URL}/{NEXT_PUBLIC_WAITING_POSITION_PATH}`

Example: `https://api.example.com/waiting/position`

### Request body (JSON)

| Field | Type | Description |
|-------|------|-------------|
| `phone` | string | Same 11-digit identifier as used when registering the waiting request. |

### Example

```json
{
  "phone": "01000000000"
}
```

### Success response

HTTP status: `2xx`

Body must include a positive integer `queueNumber` (1-based waiting order).

| Field | Type | Description |
|-------|------|-------------|
| `queueNumber` | number | Current position in the queue (e.g. 5 = fifth in line). |
| `waitingNumber` | number | **Alias:** same meaning as `queueNumber`; accepted for compatibility with list rows that use `waitingNumber`. |
| `result` | boolean | Optional; if present and `false`, treat as lookup failure. |

### Example

```json
{
  "result": true,
  "queueNumber": 5
}
```

### Client behavior

- On success, the UI shows: "현재 웨이팅 N번째 순서입니다."
- If `result` is `false` or neither `queueNumber` nor `waitingNumber` is a valid positive integer, the UI shows a not-found style message.

---

## Cross-branch compatibility (same monorepo)

| Area | Branch / route | Expectation |
|------|------------------|-------------|
| Customer waiting submit | `feature/waiting-pr` → `POST …/waiting` | Body includes `phone`, `people`, and `partySize` (duplicate) so the same backend can populate admin lists. |
| Admin waiting list | `feature/add-reservation-management` → `GET …/waiting` | JSON array items use `id`, `phone`, `partySize`, and display `waitingNumber` (derived in UI). |
| Admin enter | same branch → `POST …/tables/:tableId/enter`, then `POST …/waiting/:id/enter` | Admin selects an empty table before entering a waiting party. |
| Admin delete | same branch → `POST …/wating/:id/delete` | Deletes one waiting row without marking it as entered. The `wating` path segment is kept as requested by the current backend contract. |
| Reservations admin | `GET …/reservations` | Uses `phoneNumber`, `peopleCount`, `visitTime` — **different resource** from waiting; customer waiting flow does not send `visitTime`. Align only if the product merges those APIs. |
| Tables (seats) | `GET …/tables` | Independent of waiting customer payload. |

---

## Admin waiting enter with table assignment

Moves a waiting party into a selected table and removes that party from the waiting queue.

### Required table list

The admin page calls `GET {NEXT_PUBLIC_API_BASE_URL}/tables` and expects this shape:

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Table ID used in the table enter URL. |
| `name` | string | Display name shown in the table selector. |
| `entryTime` | string \| null | `null` means the table is currently available. |

### Client flow

1. The admin selects an available table from the waiting row.
2. The client calls `POST {NEXT_PUBLIC_API_BASE_URL}/tables/{table_id}/enter`.
3. If the table enter call succeeds, the client calls `POST {NEXT_PUBLIC_API_BASE_URL}/waiting/{id}/enter`.
4. If both calls succeed, the waiting row is removed from the local list and waiting numbers are recalculated.

### Request body

No body is required for either call. The table assignment is represented by the `{table_id}` path parameter.

### Error behavior

If either request returns a non-2xx HTTP status, the UI shows an error and keeps the waiting row visible.

---

## Admin waiting delete

Deletes a waiting entry from the admin waiting list.

### API name

`wating/{id}/delete`

### Method

`POST`

### URL

`{NEXT_PUBLIC_API_BASE_URL}/wating/{id}/delete`

Example: `https://api.example.com/wating/12/delete`

### Path parameters

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Waiting entry ID to delete. |

### Request body

No body is required.

### Success response

HTTP status: `2xx`

Body may be empty. If JSON is returned, this client does not require a specific field.

### Error responses

Any non-2xx HTTP status is treated as failure and the row remains visible in the UI.

### Client behavior

- The admin UI asks for confirmation before calling the API.
- On success, the deleted row is removed from the local table.
- Remaining waiting numbers are recalculated in the UI from 1.
