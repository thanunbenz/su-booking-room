# 📝 Makefile Cheatsheet - SU Booking Room

คำสั่งที่ใช้บ่อยที่สุด - แปะไว้ดูง่ายๆ

---

## 🚀 เริ่มต้น / หยุด

```bash
make up                 # ⬆️  Start ทุกอย่าง
make down               # ⬇️  Stop ทุกอย่าง
make restart            # 🔄 Restart
make status             # 📊 เช็คสถานะ
```

---

## 📜 ดู Logs

```bash
make logs               # 📋 ทุก services
make logs-backend       # 🔧 Backend อย่างเดียว
make logs-frontend      # 🎨 Frontend อย่างเดียว
make logs-db            # 💾 Database อย่างเดียว
```

**Tip:** กด `Ctrl+C` เพื่อออก

---

## 🔨 Build / Rebuild

```bash
make build              # 🏗️  Build images ใหม่
make rebuild            # 🔄 Stop + Build + Start
```

---

## 💻 Development Mode

```bash
make dev-backend        # Go + Hot reload
make dev-frontend       # Next.js + Hot reload
```

**หมายเหตุ:** ไม่ใช้ Docker, รันบน local

---

## 🗄️ Database

```bash
make db-shell           # 💻 เข้า PostgreSQL shell
make db-reset           # ⚠️  Reset DB (ลบข้อมูลทั้งหมด!)
```

**ใน db-shell:**
```sql
\dt                     -- ดูตารางทั้งหมด
\d users                -- ดู schema
SELECT * FROM users;    -- Query
\q                      -- ออก
```

---

## 🧹 ทำความสะอาด

```bash
make clean              # 🧹 ลบ containers + volumes
make clean-all          # 🗑️  ลบทุกอย่าง + images
```

---

## ⚙️ อื่นๆ

```bash
make help               # ❓ ดูคำสั่งทั้งหมด
make install            # 📦 Install dependencies
make test-backend       # 🧪 Run tests
```

---

## 🔥 คำสั่งยอดฮิต Top 10

1. `make up` - เริ่มทำงาน
2. `make down` - เลิกงาน
3. `make logs` - Debug
4. `make logs-backend` - Debug backend
5. `make status` - เช็คสถานะ
6. `make restart` - Restart เร็ว
7. `make rebuild` - แก้โค้ดแล้ว rebuild
8. `make db-shell` - ดู database
9. `make db-reset` - เริ่มใหม่
10. `make help` - ช่วยเหลือ

---

## 🎯 Workflow ประจำวัน

### เริ่มงาน:
```bash
make up
make status
# เปิด http://localhost:3000
```

### แก้โค้ด:
```bash
# แก้แล้ว rebuild
make rebuild
```

### Debug:
```bash
make logs-backend
# หรือ
make db-shell
```

### เลิกงาน:
```bash
make down
```

---

## 🆘 แก้ปัญหาเร่งด่วน

```bash
# ปัญหาทั่วไป - ลอง restart
make restart

# ยังไม่หาย - rebuild
make rebuild

# ยังไม่หาย - เคลียร์ทุกอย่าง
make clean
make build
make up

# Database พัง
make db-reset

# หา process ที่ใช้ port
lsof -i:3000
lsof -i:8000
```

---

## 📌 URLs

- 🌐 Frontend: http://localhost:3000
- 🚀 Backend: http://localhost:8000
- 💓 Health: http://localhost:8000/health
- 🗄️ Database: localhost:5432

---

## 💡 Pro Tips

```bash
# ดู logs แบบ live + filter
make logs-backend | grep -i error

# Restart แค่ backend
docker-compose restart backend

# เข้า container shell
docker-compose exec backend sh

# ดู resource usage
docker stats

# Clean Docker cache ทั้งหมด
docker system prune -af --volumes
```

---

**อ่านเพิ่ม:** [MAKEFILE_GUIDE.md](MAKEFILE_GUIDE.md) | [QUICK_START.md](QUICK_START.md)
