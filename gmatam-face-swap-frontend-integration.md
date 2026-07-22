# GMATAM Face Swap API 串接契約

> 本文件提供前端串接所需的 API 呼叫時機與 request／response schema。

## 1. 共通契約

### Base path

所有端點皆位於 `/api/face-swap`。

### 身分驗證

所有請求都必須帶入有效的 LIFF access token：

```http
Authorization: Bearer <LIFF access token>
Accept: application/json
```

- 未帶 token 或 token 無效時回傳 HTTP 401。
- 使用者身分由 token 決定，request 不接受 `userId`、`user_id` 或其他使用者識別欄位。
- `event` 由後端決定，request 不需提供。

### 回應格式

成功與失敗回應皆使用相同的外層結構：

```json
{
  "status": "success",
  "statusCode": 200,
  "message": "...",
  "result": {}
}
```

各端點的 `result` schema 定義於後續章節。

## 2. 生圖流程與 API 呼叫時機

```text
┌─────────────────────────────┐
│ 使用者進入活動頁            │
└──────────────┬──────────────┘
               │
               ├── GET /api/face-swap/usage
               │      └── 取得 result.count
               │
               └── GET /api/face-swap/history
                      └── 取得 result.avatars

┌─────────────────────────────┐
│ 使用者選擇兩張圖片並確認生成 │
└──────────────┬──────────────┘
               │
               ▼
       POST /api/face-swap
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
  HTTP 4xx／5xx     HTTP 200
  顯示錯誤並停止    取得 task_id、status
                        │
                        ├── GET /api/face-swap/usage
                        │      └── 更新 result.count
                        │
                        ▼
          GET /api/face-swap/status/{taskId}
                        │
                        └── result.status
                              ├── pending    → 至少 3 秒後再次輪詢
                              ├── processing → 至少 3 秒後再次輪詢
                              ├── completed  → 停止輪詢並顯示 result.image
                              └── failed     → 停止輪詢並顯示生成失敗

completed 後：
  ├── GET /api/face-swap/usage   → 重新同步使用次數
  └── GET /api/face-swap/history → 重新同步生成紀錄

failed 後：
  └── GET /api/face-swap/usage   → 重新同步使用次數（failed 不列入 history）
```

### 呼叫時機摘要

| 時機 | API | 用途 |
|---|---|---|
| 使用者進入活動頁，或需要重新同步額度時 | `GET /api/face-swap/usage` | 取得目前已使用次數 |
| 使用者進入活動頁，或需要重新整理生成紀錄時 | `GET /api/face-swap/history` | 取得當前使用者的生成紀錄 |
| 使用者確認兩張圖片、性別與模板後 | `POST /api/face-swap` | 建立生成任務並取得 `task_id` |
| 任務狀態為 `pending` 或 `processing` 時 | `GET /api/face-swap/status/{taskId}` | 間隔至少 3 秒查詢任務最新狀態 |
| 任務狀態變為 `completed` 或 `failed` 時 | 停止輪詢 | `completed` 可讀取 `image`；`failed` 不會計入使用次數 |
| 任務完成後 | usage／history | 重新同步使用次數與生成紀錄 |
| 任務失敗後 | usage | 重新同步使用次數；`failed` 不列入 history |

後端會在建立任務時再次檢查額度；前端顯示的次數不取代後端的額度判斷。

### 輪詢頻率

- 建立任務成功後，建議等待 3 秒再進行第一次 status 查詢。
- 後續輪詢間隔建議至少 3 秒，不要在收到 response 前送出同一 `taskId` 的下一次查詢。
- 僅在狀態為 `pending` 或 `processing` 時繼續輪詢；`completed` 或 `failed` 必須停止。
- 後端不另外對這四個活動 API 套用 rate limit；前端仍必須遵守上述間隔與不得重疊的規則。

## 3. API 一覽

| Method | Path | 說明 |
|---|---|---|
| GET | `/api/face-swap/usage` | 查詢目前已使用次數 |
| GET | `/api/face-swap/history` | 查詢當前使用者的生成紀錄 |
| POST | `/api/face-swap` | 建立生成任務 |
| GET | `/api/face-swap/status/{taskId}` | 查詢指定任務狀態 |

## 4. Interface schema

### 4.1 查詢使用次數

`GET /api/face-swap/usage`

#### Request

無 query parameter 或 request body。

#### Response — HTTP 200

```json
{
  "status": "success",
  "statusCode": 200,
  "message": "...",
  "result": {
    "count": 2
  }
}
```

| 欄位 | Type | 說明 |
|---|---|---|
| `result.count` | integer | 目前已使用次數；無紀錄時為 `0` |

計數包含 `pending`、`processing`、`completed`，不包含 `failed`。目前上限為 5。

### 4.2 查詢生成紀錄

`GET /api/face-swap/history`

#### Request

無 query parameter 或 request body。

#### Response — HTTP 200

```json
{
  "status": "success",
  "statusCode": 200,
  "message": "...",
  "result": {
    "avatars": [
      {
        "task_id": "01J...",
        "status": "completed",
        "image": "https://example.com/result.jpg",
        "created_at": "2026-07-22T10:00:00+08:00"
      }
    ]
  }
}
```

| 欄位 | Type | 說明 |
|---|---|---|
| `result.avatars` | array | 當前使用者的生成紀錄；無紀錄時為 `[]` |
| `result.avatars[].task_id` | string | 任務識別碼 |
| `result.avatars[].status` | string | `pending`、`processing` 或 `completed`；`failed` 不列入 history |
| `result.avatars[].image` | string | `completed` 時為圖片 URL；其他狀態為空字串 |
| `result.avatars[].created_at` | string\|null | ISO 8601 建立時間 |

空陣列是正常的 HTTP 200 回應，不代表查詢失敗。

### 4.3 建立生成任務

`POST /api/face-swap`

#### Request

Content-Type：`multipart/form-data`

| 欄位 | Type | 必填 | 規則 |
|---|---|---|---|
| `images[]` | file[] | 是 | 固定兩張；第一張為過去照片、第二張為現在照片 |
| `gender` | string | 是 | `male` 或 `female` |
| `template_id` | string | 是 | 最長 100 字元 |

圖片僅接受 JPG、JPEG、PNG，單檔上限為 10 MB。

#### Response — HTTP 200

```json
{
  "status": "success",
  "statusCode": 200,
  "message": "...",
  "result": {
    "task_id": "01J...",
    "status": "pending"
  }
}
```

| 欄位 | Type | 說明 |
|---|---|---|
| `result.task_id` | string | 後續輪詢使用的任務識別碼 |
| `result.status` | string | 任務初始狀態 |

### 4.4 查詢任務狀態

`GET /api/face-swap/status/{taskId}`

#### Path parameter

| 參數 | Type | 說明 |
|---|---|---|
| `taskId` | string | 建立生成任務時回傳的 `result.task_id` |

#### Response — HTTP 200

```json
{
  "status": "success",
  "statusCode": 200,
  "message": "...",
  "result": {
    "task_id": "01J...",
    "status": "completed",
    "image": "https://example.com/result.jpg"
  }
}
```

| 欄位 | Type | 說明 |
|---|---|---|
| `result.task_id` | string | 任務識別碼 |
| `result.status` | string | `pending`、`processing`、`completed` 或 `failed` |
| `result.image` | string | `completed` 時為圖片 URL；其他狀態為空字串 |

建議輪詢間隔至少 3 秒，且同一 `taskId` 不要同時送出多個 status request。前端只需在 `pending` 或 `processing` 時繼續輪詢；收到 `completed` 或 `failed` 後停止。

## 5. 錯誤狀態

| HTTP status | 適用端點 | 說明 |
|---|---|---|
| 401 | 全部 | LIFF access token 缺少或無效 |
| 403 | 建立任務 | 已達使用次數上限 |
| 404 | 查詢狀態 | 任務不存在，或不屬於當前使用者 |
| 422 | 建立任務 | request 欄位驗證失敗 |
| 423 | 建立任務 | 暫時無法取得額度檢查鎖，可稍後重試 |
| 500 | history／status／usage | 查詢或處理失敗 |
| 502 | 建立任務 | 生成服務處理失敗 |

錯誤訊息位於外層 `message`；欄位驗證錯誤位於 `result.errors`。
