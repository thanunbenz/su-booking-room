# 🔄 API Testing Workflow

คู่มือเลือกวิธีทดสอบ API ที่เหมาะสมกับสถานการณ์

---

## 📊 เลือกวิธีทดสอบตามสถานการณ์

### 🎯 Scenario 1: เพิ่งเริ่มโปรเจค / เรียนรู้ API
**แนะนำ:** Postman

**เหตุผล:**
- UI ใช้งานง่าย ไม่ต้องจำคำสั่ง
- เห็น Request/Response ชัดเจน
- Save request ไว้ใช้ซ้ำได้
- Auto-save token อัตโนมัติ

**เริ่มต้น:**
1. Import `SU_Booking_Room_Postman_Collection.json`
2. Import `SU_Booking_Room_Postman_Environment.json`
3. เลือก Environment: "SU Booking Room - Local"
4. Login ผ่าน folder "1. Setup"
5. เริ่มทดสอบ endpoints อื่นๆ

📖 **คู่มือ:** [API Testing Quick Reference](API_TESTING_QUICKREF.md#1️⃣-postman-แนะนำสำหรับมือใหม่)

---

### 🚀 Scenario 2: ทดสอบหลัง commit code ใหม่
**แนะนำ:** Bash Script (Automated Testing)

**เหตุผล:**
- รันทดสอบทุก endpoint พร้อมกันได้
- ตรวจสอบ regression bugs
- เห็นผลทันที (ผ่าน/ไม่ผ่าน)
- ไม่ต้อง manual testing

**เริ่มต้น:**
```bash
# ทำครั้งเดียว
chmod +x docs/api/test_booking_api.sh

# รันทุกครั้งหลัง commit
./docs/api/test_booking_api.sh
```

**ผลลัพธ์:**
- ✅ สีเขียว = Endpoint ทำงานถูกต้อง
- ❌ สีแดง = Endpoint มีปัญหา (ต้องแก้!)

📖 **คู่มือ:** [API Testing Quick Reference](API_TESTING_QUICKREF.md#2️⃣-bash-script-แนะนำสำหรับทดสอบอัตโนมัติ)

---

### 🔍 Scenario 3: Debug ปัญหาเฉพาะ endpoint
**แนะนำ:** curl + Postman

**เหตุผล:**
- curl ให้ control เต็มที่ (header, body, timeout)
- Debug ละเอียดได้
- Postman ช่วยดู response ง่ายขึ้น

**Workflow:**
1. ใช้ curl ทดสอบ request แบบต่างๆ
2. Copy request ที่มีปัญหาไป Postman
3. ดู response และ debug

**ตัวอย่าง:**
```bash
# Test with curl
curl -v -X POST http://localhost:8000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_id": 1, "title": "Test"}'

# -v = verbose (ดู headers ทั้งหมด)
```

📖 **คู่มือ:** [Booking API Test Guide](BOOKING_API_TEST.md)

---

### 📝 Scenario 4: เขียนเอกสาร API
**แนะนำ:** Postman Collection

**เหตุผล:**
- ใช้ Postman Collection เป็น living documentation
- Export เป็น markdown ได้
- Share ให้ทีมได้เลย

**Workflow:**
1. ทดสอบ endpoint ใน Postman
2. เขียน description และ examples
3. Export collection
4. Share ให้ทีม

---

### 🧪 Scenario 5: CI/CD Pipeline
**แนะนำ:** Bash Script + Newman (Postman CLI)

**เหตุผล:**
- Automate testing ใน pipeline
- รันบน server ได้โดยไม่ต้องมี UI
- ตรวจสอบก่อน deploy

**Setup:**
```bash
# ใช้ Bash script
./docs/api/test_booking_api.sh

# หรือใช้ Newman (Postman CLI)
npm install -g newman
newman run docs/api/SU_Booking_Room_Postman_Collection.json \
  -e docs/api/SU_Booking_Room_Postman_Environment.json
```

---

### 🎓 Scenario 6: สอนทีมใหม่
**แนะนำ:** Quick Reference + Postman

**เหตุผล:**
- Quick Reference มีภาพรวมทั้งหมด
- Postman ให้ลองเล่นได้จริง

**Workflow:**
1. อ่าน [API Testing Quick Reference](API_TESTING_QUICKREF.md)
2. Import Postman collection
3. ให้ทีมทดสอบเอง
4. ถามคำถามเพิ่มเติม

---

## 🔄 Recommended Workflow (Best Practice)

### Development Phase
```
1. พัฒนา endpoint ใหม่
   ↓
2. ทดสอบด้วย Postman (manual)
   ↓
3. เพิ่ม request เข้า Collection
   ↓
4. รัน Bash script (automated)
   ↓
5. Commit code
```

### Testing Phase
```
1. Pull code ใหม่
   ↓
2. รัน Bash script
   ↓
3. ถ้ามี endpoint ที่ fail → Debug ด้วย curl/Postman
   ↓
4. แก้ไข
   ↓
5. รัน Bash script อีกครั้ง
```

### Before Deploy
```
1. รัน Bash script (full test)
   ↓
2. ตรวจสอบ error scenarios
   ↓
3. ตรวจสอบ permission tests
   ↓
4. ✅ ทุก test ผ่าน → Deploy
```

---

## 📚 เอกสารแต่ละประเภท

### Quick Reference (เริ่มที่นี่!)
**ไฟล์:** [API_TESTING_QUICKREF.md](API_TESTING_QUICKREF.md)

**เนื้อหา:**
- วิธีเลือก testing method
- Endpoint reference ฉบับย่อ
- Common errors
- Default users

**เหมาะสำหรับ:** ทุกคน (เริ่มอ่านตรงนี้ก่อน)

---

### Detailed Guide (อ่านเพิ่มเติม)
**ไฟล์:** [BOOKING_API_TEST.md](BOOKING_API_TEST.md)

**เนื้อหา:**
- Request/Response examples ทั้งหมด
- Test scenarios ละเอียด
- Troubleshooting guide
- Advanced testing techniques

**เหมาะสำหรับ:** นักพัฒนาที่ต้องการรายละเอียด

---

### Postman Files (พร้อมใช้งาน)
**ไฟล์:**
- `SU_Booking_Room_Postman_Collection.json`
- `SU_Booking_Room_Postman_Environment.json`

**เนื้อหา:**
- Pre-configured requests
- Auto-save token scripts
- Environment variables

**เหมาะสำหรับ:** ทุกคนที่ใช้ Postman

---

### Bash Script (อัตโนมัติ)
**ไฟล์:** `test_booking_api.sh`

**เนื้อหา:**
- 16 automated test scenarios
- Color-coded output
- JSON formatting

**เหมาะสำหรับ:** ทดสอบรวดเร็ว, CI/CD

---

## 🎯 Quick Decision Tree

```
คุณต้องการ...

├─ เรียนรู้ API ครั้งแรก?
│  └─ ใช้ Postman + Quick Reference
│
├─ ทดสอบหลัง commit?
│  └─ ใช้ Bash Script
│
├─ Debug ปัญหา?
│  └─ ใช้ curl + Postman
│
├─ เขียนเอกสาร?
│  └─ ใช้ Postman Collection
│
└─ Setup CI/CD?
   └─ ใช้ Bash Script / Newman
```

---

## ✅ Testing Checklist

### ก่อน Commit Code
- [ ] ทดสอบ endpoint ใหม่ด้วย Postman
- [ ] เพิ่ม request เข้า Collection
- [ ] รัน Bash script (ต้องผ่านทุก test)
- [ ] ตรวจสอบ error handling
- [ ] ตรวจสอบ permission rules

### ก่อน Deploy
- [ ] รัน Bash script บน staging
- [ ] ทดสอบ happy path scenarios
- [ ] ทดสอบ error scenarios
- [ ] ทดสอบ validation rules
- [ ] ทดสอบ permission tests

### หลัง Deploy
- [ ] รัน Bash script บน production
- [ ] ตรวจสอบ response time
- [ ] ตรวจสอบ error logs

---

## 🔗 เอกสารที่เกี่ยวข้อง

- ⚡ **[Quick Reference](API_TESTING_QUICKREF.md)** - เริ่มต้นที่นี่
- 📖 **[Detailed Guide](BOOKING_API_TEST.md)** - คู่มือเต็ม
- 📦 **[API README](README.md)** - ภาพรวมการทดสอบ
- 🖥️ **[Backend README](../../backend/README.md)** - Backend documentation

---

**Last Updated:** 2026-01-24
**Version:** 1.0.0
