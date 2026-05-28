# 📖 Social App - Frontend Integration Guide

هذا الملف مخصص لمطوري الواجهة الأمامية (Frontend) ويوضح خطة العمل الشاملة وكيفية ربط التطبيق مع الـ Backend (REST APIs, GraphQL, Socket.io).

---

## 🚀 خطة العمل (Frontend Execution Plan)

يُفضل تنفيذ الربط مع الـ Backend بالترتيب التالي لضمان سير العمل بشكل صحيح:

### المرحلة الأولى: المصادقة (Authentication)

1. **التسجيل وتسجيل الدخول (Register & Login):** قم بإنشاء واجهات التسجيل وتسجيل الدخول. عند نجاح تسجيل الدخول، ستحصل على `access_token` و `refresh_token`.
2. **حفظ التوكنز:** قم بحفظ التوكنز في `localStorage` أو `Cookies`.
3. **إعداد Axios Interceptor:**
   - يجب إرفاق `access_token` في الـ `Headers` (مثل: `Authorization: Bearer <access_token>`) في جميع الطلبات (Requests).
   - في حال انتهاء صلاحية `access_token` (حصولك على Error 401/403)، يجب عمل Request تلقائي لـ Refresh Token باستخدام `refresh_token` لتجديد الجلسة، ثم إعادة إرسال الطلب الأصلي.

### المرحلة الثانية: الاتصال اللحظي (Real-Time Socket.io)

1. قم بإنشاء اتصال (Connection) بـ Socket.io فور نجاح تسجيل الدخول أو عند فتح التطبيق والمستخدم مسجل دخوله.
2. **مصادقة السوكت (Socket Auth):** يجب تمرير الـ `access_token` داخل `auth.authorization` أو `headers.authorization` أثناء الاتصال.
3. الاستماع للأحداث (Events) مثل الرسائل الجديدة وتحديثات حالة الاتصال (Online/Offline).

### المرحلة الثالثة: المحتوى والتفاعل (Social Features)

1. استدعاء بيانات المستخدم (Profile).
2. عرض المنشورات (Posts) باستخدام REST أو GraphQL.
3. التفاعل مع المنشورات وإضافة التعليقات (Comments).

### المرحلة الرابعة: المحادثات (Chat System)

1. واجهة الرسائل الفردية (One-to-One).
2. واجهة إنشاء الجروبات (Group Chat) مع رفع صورة للجروب.
3. استخدام REST API لجلب الرسائل القديمة (Pagination)، و Socket.io لإرسال واستقبال الرسائل الجديدة لحظياً.

---

## 🌐 قائمة الروابط (API Endpoints Overview)

**الرابط الأساسي (Base URL):** `http://localhost:3000` (أو الرابط الخاص بالإنتاج)

### 1. مصادقة المستخدمين (Auth) `[POST] /auth/...`

- **Register:** إنشاء حساب جديد.
- **Login:** تسجيل الدخول والحصول على التوكنز.
- **Refresh Token / Rotate:** تجديد الـ `access_token` عند انتهائه باستخدام الـ `refresh_token`.

### 2. بيانات المستخدم (User) `[GET/POST] /user/...`

- **Get Profile:** جلب بيانات الحساب (والجروبات الخاصة بالمستخدم).
- **Logout:**
  - جهاز واحد: `flag=CURRENT`
  - خروج من جميع الأجهزة: `flag=ALL`
- **Delete Account:** حذف الحساب نهائياً (يتطلب مصادقة).

### 3. المنشورات والتعليقات (Posts & Comments)

- **`/post` (GET, POST, DELETE, etc.):** لإنشاء وحذف وعرض المنشورات والتفاعل معها.
- **`/:postId/comment`:** لإضافة تعليقات للمنشور (يتم تمرير ID المنشور كـ Param).

### 4. المحادثات (Chat) `[GET/POST] /chat/...`

- **Get OVO Chat (`GET /chat/:participantId`):** جلب محادثة فردية مع مستخدم آخر باستخدام نظام الـ Pagination (باستخدام `page` و `size` في الـ Query).
- **Get Group Chat (`GET /chat/group/:groupId`):** جلب محادثات الجروب (مع الـ Pagination).
- **Create Group (`POST /chat/group`):** لإنشاء جروب جديد. يتطلب `FormData` لإرسال:
  - `participantsIds` (مصفوفة الـ IDs).
  - `group` (اسم الجروب).
  - `file` (صورة الجروب).

---

## ⚡ الاتصال اللحظي (Socket.io Events)

**اتصال السوكت (Initialization):**

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    authorization: "Bearer YOUR_ACCESS_TOKEN", // هام جداً للمصادقة
  },
});
```

**الأحداث المتاحة (Events):**

- `connection` / `disconnect`: للتعرف على حالة اتصال المستخدم.
- `offline_user`: للاستماع لخروج مستخدم من النظام (مفيد لمعرفة آخر ظهور).
- `sayHi`: حدث للتجربة (Test).
- _ملاحظة:_ توجد أحداث أخرى متعلقة بالدردشة يتم تسجيلها في `chatGateway` (مثل إرسال واستقبال الرسائل).

---

## 📊 استعلامات GraphQL

الـ Backend يدعم الـ GraphQL للطلبات المخصصة عبر الرابط:

- **الرابط:** `[POST] /graphql`
- **الـ Headers:** `Authorization: Bearer <access_token>`
- يوفر مرونة عالية لجلب بيانات المستخدمين أو المنشورات بحسب الـ Schema المُعرفة.

---

## 🛠️ ملاحظات هامة للـ Frontend

1. **رفع الصور:** عند إنشاء جروب أو نشر منشور بصورة، يجب إرسال البيانات باستخدام `FormData` وليس `JSON` لكي يتم رفع الصور بنجاح عبر `Multer` لـ `Cloudinary`.
2. **الـ Pagination:** في صفحات الـ Feed و الـ Chat، اعتمد دائمًا على معاملات `page` و `size` لتقليل الحمل وجلب البيانات دفعات.
3. **معالجة الأخطاء (Error Handling):** جميع رسائل الخطأ من الـ Backend تعود في شكل Object يحتوي على `message` و `statusCode`. يجب عرض الـ `message` للمستخدم.
