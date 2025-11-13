
#  Telehealth Developer Fullstack Test - Simple Chat App

แอปพลิเคชันส่งข้อความแบบ 1-on-1 ที่สร้างขึ้นด้วย Next.js (React) + Tailwind CSS สำหรับ Frontend และ Node.js/Express สำหรับ Backend พร้อมระบบ Authentication จำลอง

###  Features หลัก

*  ระบบ **Login/Register** (ใช้ Username/Password)
* [cite_start] แสดงชื่อผู้ใช้ปัจจุบันที่ล็อกอินอยู่ [cite: 37]
* [cite_start] รายการการสนทนา (แสดงชื่อคู่สนทนา, ข้อความล่าสุด, เวลา) [cite: 31]
* [cite_start] การเรียงลำดับการสนทนาตามข้อความล่าสุด [cite: 19, 31]
* [cite_start] การเริ่มการสนทนาใหม่ (ป้องกันการสนทนาซ้ำซ้อน) [cite: 20, 32]
* [cite_start] ห้องแชท (แสดงข้อความ, ผู้ส่ง, เวลา) [cite: 34]
* [cite_start] การส่งข้อความใหม่ [cite: 35]
* [cite_start] การจัดการสถานะ Loading และ Error [cite: 38]
* [cite_start] การอนุญาต (Authorization) ที่เหมาะสม: ผู้ใช้เห็นและส่งข้อความได้เฉพาะในการสนทนาของตนเองเท่านั้น [cite: 28]

---

###  Stack & Technology

| ส่วน | เทคโนโลยี | หมายเหตุ |
| :--- | :--- | :--- |
| **Frontend** | [cite_start]Next.js (React) + **TypeScript** [cite: 10, 52] | [cite_start]ใช้ Tailwind CSS สำหรับ Styling [cite: 10, 39] |
| **Backend** | [cite_start]Node.js + Express [cite: 11] | |
| **Database** | [cite_start]In-memory Arrays (JavaScript Arrays) [cite: 11] | ข้อมูลจะหายไปเมื่อ Server ถูกรีสตาร์ท |

---

### การตั้งค่าและการรันโปรเจกต์ (Setup & Run)

#### 1. Backend Setup & Run

1.  **ไปที่โฟลเดอร์ Backend:**
    ```bash
    cd backend
    ```
2.  **ติดตั้ง Dependencies:**
    ```bash
    npm install
    ```
3.  **รันเซิร์ฟเวอร์ (Development Mode):**
    ```bash
    npm start
    ```
    *เซิร์ฟเวอร์จะรันที่:* `http://localhost:3001`

#### 2. Frontend Setup & Run

1.  **ไปที่โฟลเดอร์ Frontend:**
    ```bash
    cd frontend
    ```
2.  **ติดตั้ง Dependencies:**
    ```bash
    npm install
    ```
3.  **รันแอปพลิเคชัน (Development Mode):**
    ```bash
    npm run dev
    ```
    *แอปพลิเคชันจะรันที่:* `http://localhost:3000`

---

### การตั้งค่า/ทดสอบผู้ใช้ (Authentication & Testing)

#### [cite_start]1. การตั้งค่าผู้ใช้ (Seeded Users) [cite: 14, 62]

ผู้ใช้เริ่มต้นถูก Seeded ในไฟล์ `backend/data.js`:

| ชื่อผู้ใช้ (Username) | User ID (ใช้ในการจำลอง Header) | Password |
| :--- | :--- | :--- |
| **Alice** | `user1` | `password1` |
| **Bob** | `user2` | `password2` |
| **Charlie** | `user3` | `password3` |

คุณสามารถ **Register** ผู้ใช้ใหม่ได้จากหน้าจอเริ่มต้น

#### [cite_start]2. วิธีการกำหนด "Current User" [cite: 14, 63]

* [cite_start]Frontend จะส่ง `userId` ที่ได้จากการ Login ผ่าน **Request Header** ชื่อ `x-user-id` ไปยังทุก API Call[cite: 14].
* [cite_start]Backend จะใช้ ID นี้ในการระบุตัวตนและตรวจสอบสิทธิ์ (Authorization)[cite: 27, 28].

---

### [cite_start] หมายเหตุทางเทคนิคและ Trade-offs [cite: 63]

* [cite_start]**Validation:** มีการตรวจสอบ Request Payload (เช่น `content` ไม่ว่าง, `otherUserId` มีอยู่จริง) และใช้ HTTP Status Code ที่เหมาะสม (เช่น 400, 401, 404, 201)[cite: 24, 25, 71].
* [cite_start]**Real-time:** แทนที่จะใช้ WebSockets เราใช้ **Polling** ใน `ChatRoom.tsx` เพื่อดึงข้อความใหม่ทุก ๆ 3 วินาที[cite: 42].
* [cite_start]**Authorization:** Proper Authorization ถูกบังคับใช้ในทุก Endpoint ที่ละเอียดอ่อน (`/conversations`, `/messages`) เพื่อให้มั่นใจว่าผู้ใช้เห็นเฉพาะข้อมูลของตนเองเท่านั้น[cite: 28].
