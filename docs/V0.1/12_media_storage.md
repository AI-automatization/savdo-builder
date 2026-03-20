# 12_media_storage.md

## 1. Media and Storage Overview

Media layer в проекте — это инфраструктурный домен, который напрямую влияет на:

- качество storefront experience
- seller onboarding
- product presentation
- chat usability
- moderation workflows
- безопасность sensitive files
- производительность web/mobile клиентов

На V0.1 media system должна поддерживать:

- product images
- store branding assets
- seller verification documents
- chat image attachments

При этом media layer нельзя делать “временным костылём”, потому что ошибки здесь быстро приводят к:
- плохой загрузке страниц
- broken links
- утечке sensitive files
- тяжёлым и медленным клиентским flows
- проблемам с moderation и auditability

---

## 2. Goals

Основные цели media/storage слоя:

- надёжное хранение файлов
- разделение public и protected assets
- predictable media lifecycle
- удобный upload flow для web и mobile
- хорошая загрузка storefront images
- безопасная работа с verification documents
- support для chat attachments
- provider-agnostic storage model

---

## 3. Supported Media Types on V0.1

## 3.1 Product Images
Используются в:
- storefront listings
- product detail
- cart/order snapshots preview
- seller product management
- admin moderation

## 3.2 Store Branding Assets
Используются для:
- store logo
- optional cover image
- public storefront identity
- seller dashboard preview
- admin review

## 3.3 Seller Verification Documents
Используются для:
- onboarding verification
- moderation review
- admin inspection

Это sensitive media category.

## 3.4 Chat Attachments
На V0.1 поддерживаются:
- image attachments in chat

Используются в:
- product inquiry chats
- order chats
- admin inspection of threads

---

## 4. What Is Not Included on V0.1

- video uploads
- audio uploads
- arbitrary file attachments
- user-generated galleries beyond product/store needs
- AI moderation pipeline
- advanced image editing
- auto background removal
- heavy CDN transformation pipelines
- seller-managed downloadable digital assets
- advanced watermarking system

---

## 5. Storage Philosophy

## 5.1 Media Is a First-Class Domain
Файлы нельзя рассматривать как “приложение к сущности”.  
У media должны быть:
- explicit metadata
- ownership
- visibility rules
- attachment policy
- lifecycle control

## 5.2 Object Storage, Not App Server Filesystem
Файлы не должны храниться внутри app container/local disk production-инстансов.

Нужен object storage layer.

## 5.3 Metadata in DB, Blobs in Storage
Бинарный контент хранится в object storage, а в PostgreSQL хранится metadata:
- object key
- mime type
- size
- dimensions if relevant
- visibility
- ownership linkage

## 5.4 Public and Protected Media Must Be Separated
Public storefront images и protected seller documents — это разные security categories.

---

## 6. Recommended Stack

- S3-compatible object storage
- PostgreSQL for metadata
- CDN for public assets in production
- signed access / protected endpoints where needed
- image processing jobs via queue if needed

### Acceptable Providers
- AWS S3
- Cloudflare R2
- MinIO for local/dev
- other S3-compatible providers

### Why S3-Compatible
- widely supported
- portable
- production-proven
- easy to abstract
- compatible with future scaling

---

## 7. Media Categories and Visibility Model

## 7.1 Public Media
Public assets can be directly renderable in clients.

Examples:
- product images
- store logo
- store cover
- public product/brand visuals

### Visibility
- public

## 7.2 Protected Media
Accessible only to authorized users through controlled backend flow or signed access.

Examples:
- seller verification documents
- some moderation-only files

### Visibility
- protected

## 7.3 Controlled Chat Media
Chat images may be semi-public inside authenticated experience but should not be universally public by default unless product policy explicitly allows that.

Recommended:
- controlled/private storage access with backend mediation or signed URLs

### Visibility
- protected or private depending on storage model

---

## 8. Media Entity Model

Медиа должно иметь отдельную metadata entity.

### Recommended metadata fields
- media id
- owner user id if applicable
- bucket
- object key
- mime type
- file size
- width
- height
- visibility
- created at

### Why
This gives:
- auditability
- provider independence
- reusable attachment model
- clear cleanup strategy
- safe linking to domain entities

---

## 9. Storage Namespace Strategy

Нужно заранее разделить storage namespace logically.

### Recommended top-level buckets or prefixes

- `public/products/`
- `public/stores/`
- `protected/seller-docs/`
- `protected/chat/`

### Why
Это упрощает:
- lifecycle policies
- ACL strategy
- debugging
- migration
- CDN/public exposure rules

---

## 10. Upload Flow Principles

## 10.1 Upload Must Be Intentional
Нельзя разрешать клиенту произвольно заливать любые файлы куда угодно.

Правильный upload flow:
1. client requests upload intent
2. backend validates actor + upload purpose
3. backend returns upload target or accepts secure upload request
4. media metadata created/updated
5. uploaded file later attached to entity

## 10.2 Purpose-Bound Uploads
Upload intent должен знать цель:
- product image
- store logo
- seller verification document
- chat image

### Why
Это упрощает:
- validation
- ACL
- file size limits
- allowed mime types
- ownership checks

---

## 11. Direct Upload vs Proxy Upload

## 11.1 Recommended Model
Для production-oriented системы предпочтителен один из двух подходов:

### Option A: Signed Direct Upload
Backend issues pre-signed upload target, client uploads directly to storage, backend confirms metadata.

### Option B: Controlled Backend Upload
Client uploads to backend endpoint, backend streams to storage.

## 11.2 Recommendation for V0.1
Если команда хочет production-level pattern:
- use signed direct upload where practical for larger media and scale readiness

But for simplicity and faster control in early MVP:
- controlled backend upload acceptable if limits are sane and infra manageable

### Practical recommendation
- product/store images: direct upload or efficient backend upload
- seller docs: controlled secure upload preferred
- chat images: controlled upload acceptable at MVP

---

## 12. File Validation Rules

Каждая media category должна иметь own validation rules.

## 12.1 Product Images
- allowed mime types: image/jpeg, image/png, image/webp
- file size limit defined
- dimensions sanity checks optional
- reject invalid image payloads

## 12.2 Store Assets
- same as product images
- maybe stricter size guidance
- logo aspect ratio suggestions handled at UI level

## 12.3 Seller Verification Documents
- image formats supported initially
- maybe PDF later if required, but V0.1 should avoid complexity unless absolutely needed
- strict size limits
- stricter security handling

## 12.4 Chat Images
- image only
- limited file size
- no arbitrary documents
- reasonable compression on client recommended

---

## 13. Media Attachment Model

## 13.1 Upload and Attach Must Be Separated Logically
Uploading a file does not automatically mean it belongs to product/store/chat forever.

Preferred model:
- upload media
- create metadata
- attach media id to entity through domain action

## 13.2 Why This Matters
Это позволяет:
- validate ownership before attachment
- prevent orphan misuse
- support upload previews/drafts
- clean up unattached files

---

## 14. Product Image Strategy

## 14.1 Product Media Requirements
Product images are the most visible media in the system.

They must support:
- multiple images per product
- sort order
- primary image
- stable URLs or retrievable asset endpoints

## 14.2 Product Image UX Requirements
- storefront cards need optimized image loading
- product detail needs larger renders
- seller dashboard needs manageable image ordering

## 14.3 Product Media Rules
- product images should be public
- image order should be explicit
- one image may be marked primary
- deletion must not break order history snapshots unexpectedly

---

## 15. Store Asset Strategy

## 15.1 Store Logo
Store logo should be:
- optional at creation but strongly encouraged
- public
- lightweight
- easy to display in storefront and seller dashboard

## 15.2 Store Cover
Optional on V0.1 depending on UI priorities.
If supported:
- public
- optimized for responsive display
- should not block store creation if absent

---

## 16. Seller Verification Documents Strategy

## 16.1 Sensitive Nature
Seller verification docs are not public assets.

They may contain:
- personal identity info
- business document data
- sensitive images

## 16.2 Access Rules
Access allowed only to:
- owning seller where appropriate
- superadmin / moderation staff
- backend systems processing verification

## 16.3 Delivery Strategy
These documents should preferably be accessed:
- through signed short-lived URLs
or
- via protected backend proxy endpoint

They should not be world-readable.

---

## 17. Chat Attachment Strategy

## 17.1 Supported Attachments
V0.1 supports:
- image attachments only

## 17.2 Flow
1. user selects image
2. client compresses/normalizes if needed
3. upload occurs through media endpoint/intent
4. media reference returned
5. message sent with attachment metadata

## 17.3 Access Rules
Only participants in thread and admin with proper access should inspect attachment.

## 17.4 Why Not Public by Default
Chat images may include:
- addresses
- receipts
- contextual order info
- sensitive product/customer details

So they should not be universally public.

---

## 18. Public URL Strategy

## 18.1 Public Assets
Public assets should have stable retrievable URLs suitable for:
- web rendering
- mobile rendering
- social/share metadata where needed

## 18.2 CDN Recommendation
In production, public assets should ideally be served through CDN.

### Benefits
- lower latency
- better image delivery
- lower backend load
- more stable storefront performance

## 18.3 URL Abstraction
Clients should not be too tightly coupled to raw storage provider URLs if avoidable.
A thin URL builder/asset helper layer is recommended.

---

## 19. Protected Access Strategy

## 19.1 Protected Assets
Protected assets should not expose permanent public URLs.

## 19.2 Options
- signed URL with short expiry
- backend-authenticated download/stream endpoint

## 19.3 Recommendation
For verification docs and possibly chat images:
- use signed URLs or controlled authenticated access
- keep expiry short enough to limit leakage risk

---

## 20. Image Optimization Strategy

## 20.1 Need
Raw uploads can be too large and hurt:
- storefront speed
- mobile data usage
- chat experience

## 20.2 V0.1 Recommendation
At minimum:
- validate size
- encourage client compression for mobile/chat
- optionally run background optimization job for product/store images

## 20.3 Full Transformation Pipeline
Advanced responsive image derivatives can come later if needed.
V0.1 should prioritize correctness and sane file sizes over overly complex image ops.

---

## 21. Image Variants / Resizing

## 21.1 Nice to Have, Not Mandatory
Multiple derived versions:
- thumbnail
- medium
- original

can be useful, but not strictly required on first MVP if original size discipline is enforced.

## 21.2 Recommended Direction
If team capacity allows:
- create lightweight thumbnail/medium versions for storefront-heavy assets
- leave chat and docs simpler

---

## 22. Orphaned Media Cleanup

## 22.1 Problem
Users may upload files that never get attached:
- abandoned product creation
- failed chat send
- interrupted onboarding

## 22.2 Recommended Strategy
Media records should be able to track attachment status or infer it.

Periodic cleanup job should:
- identify unattached stale media
- delete storage object if safe
- remove metadata

## 22.3 Safety Rule
Never aggressively delete potentially attached media without ownership/reference validation.

---

## 23. Deletion Rules

## 23.1 Public Product/Store Media
When seller deletes or replaces media:
- entity relationship removed
- object cleanup can be immediate or delayed
- order snapshots should not depend on live asset always existing, if historical display matters use stored URL snapshot

## 23.2 Seller Docs
If replaced:
- old docs may need retention during review history depending on moderation policy
- deletion should be controlled

## 23.3 Chat Attachments
Deleting message/file policy on V0.1 should be conservative.
Do not build complex user-facing deletion semantics unless product explicitly requires it.

---

## 24. Security Rules

## 24.1 Required
- validate mime type
- validate max size
- validate upload purpose
- validate actor ownership before attach
- separate public/protected storage behavior
- deny arbitrary path/object key manipulation
- sanitize file metadata if needed

## 24.2 Strongly Recommended
- virus scanning later if file types broaden
- image decoding validation
- content moderation later if abuse grows

---

## 25. Admin and Moderation Access

## 25.1 Admin Needs
Admin must be able to inspect:
- store branding
- product images
- seller verification docs
- chat attachments in thread context

## 25.2 Audit Sensitivity
Viewing seller verification docs is especially sensitive and should be treated carefully in admin operations.

---

## 26. Performance Requirements

## 26.1 Public Storefront Images
Must load quickly and consistently.

Priorities:
- caching
- CDN delivery
- proper sizing
- avoid oversized raw originals

## 26.2 Seller Dashboard Uploads
Must feel stable:
- progress indicators
- upload validation errors
- preview support

## 26.3 Chat Attachments
Must not feel heavy or broken:
- compressed where possible
- upload progress visible
- retry flow clear

---

## 27. Developer-Facing Architecture

### Suggested backend structure

```bash
/src/integrations/storage
  storage.module.ts
  storage.service.ts
  storage.provider.ts
  signed-url.service.ts

/src/modules/media
  media.module.ts
  /controllers
  /services
  /repositories
  /dto

Separation Principle

storage integration abstracts provider mechanics

media module owns business logic and metadata

product/store/chat modules only reference media ids and attachment services

28. API Surface Suggestions
Example endpoints
POST   /api/v1/media/upload-intent
POST   /api/v1/media/upload
POST   /api/v1/media/:id/attach
DELETE /api/v1/media/:id
GET    /api/v1/media/:id/access

Actual API shape can vary, but core ideas should remain:

validate purpose

upload safely

attach intentionally

access according to visibility policy

29. Testing Priorities
29.1 Critical Scenarios

upload product image

attach product image

reorder product images

upload store logo

upload seller verification doc

admin accesses protected doc

upload chat image

send message with image attachment

reject invalid file type

reject oversized file

reject unauthorized attachment attempt

29.2 Failure Cases

upload interrupted

object stored but metadata missing

metadata exists but object missing

signed URL expired

protected media accessed by wrong actor

orphan cleanup removes stale file safely

30. Final Media and Storage Rules

object storage is the source of binary truth; database stores metadata

public and protected media must be clearly separated

media uploads must be purpose-bound and validated

upload and attach are related but distinct stages

product/store media should optimize for storefront performance

seller verification documents must never be public

chat images should be controlled, not casually exposed

cleanup strategy for unattached media is required

backend remains the authority on visibility and access

Главная цель media/storage слоя:
обеспечить быстрый, безопасный и управляемый поток работы с изображениями и документами, чтобы storefront, chat, onboarding и moderation были надёжными и не создавали инфраструктурного хаоса.