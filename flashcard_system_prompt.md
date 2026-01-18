# 🎴 Hệ Thống Tạo Thẻ Học Tiếng Anh Từ Hình Ảnh (Flashcard Generator)

## 📋 Mô Tả Hệ Thống

Hệ thống cho phép người dùng **upload hình ảnh** và tự động tạo ra các **thẻ học tiếng Anh (flashcards)** với hiệu ứng **lật thẻ** (flip card). AI sẽ phân tích hình ảnh và tạo nội dung học tập phù hợp.

---

## 🎯 Mục Tiêu

1. **Nhận diện đối tượng** trong hình ảnh
2. **Tạo từ vựng tiếng Anh** liên quan đến hình ảnh
3. **Thiết kế flashcard** với hiệu ứng lật thẻ tương tác
4. **Hỗ trợ học tập** qua hình ảnh trực quan

---

## 🔧 Yêu Cầu Chức Năng

### 1. Upload & Xử Lý Hình Ảnh
- Hỗ trợ định dạng: JPG, PNG, WEBP, GIF
- Kích thước tối đa: 10MB
- Có thể upload nhiều ảnh cùng lúc
- Preview hình ảnh trước khi xử lý

### 2. Phân Tích Hình Ảnh (AI)
- Nhận diện vật thể chính trong ảnh
- Xác định ngữ cảnh và chủ đề
- Trích xuất màu sắc, hình dạng (nếu cần)
- Gợi ý từ vựng liên quan

### 3. Tạo Flashcard

#### Mặt Trước (Front)
```
┌─────────────────────────────┐
│                             │
│      [HÌNH ẢNH UPLOAD]      │
│                             │
│─────────────────────────────│
│   "Click để xem đáp án"     │
└─────────────────────────────┘
```

#### Mặt Sau (Back) - Sau khi lật
```
┌─────────────────────────────┐
│  📝 TỪ VỰNG: Apple          │
│  🔊 Phiên âm: /ˈæp.əl/      │
│  🇻🇳 Nghĩa: Quả táo         │
│─────────────────────────────│
│  📖 Ví dụ:                  │
│  "I eat an apple every day" │
│  (Tôi ăn một quả táo mỗi    │
│   ngày)                     │
└─────────────────────────────┘
```

### 4. Hiệu Ứng Lật Thẻ (Flip Animation)
- Hiệu ứng 3D flip mượt mà
- Thời gian animation: 0.6s
- Có thể click hoặc hover để lật
- Hỗ trợ cả desktop và mobile

---

## 📐 Thiết Kế Giao Diện

### Cấu Trúc Flashcard

```css
/* CSS Animation cho Flip Card */
.flashcard {
  width: 300px;
  height: 400px;
  perspective: 1000px;
}

.flashcard-inner {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flashcard.flipped .flashcard-inner {
  transform: rotateY(180deg);
}

.flashcard-front, .flashcard-back {
  backface-visibility: hidden;
}

.flashcard-back {
  transform: rotateY(180deg);
}
```

### Layout Trang Chính

```
┌──────────────────────────────────────────────┐
│  🎴 FLASHCARD GENERATOR                      │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │     📤 KÉO THẢ HOẶC CLICK ĐỂ UPLOAD   │  │
│  │              HÌNH ẢNH                  │  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  📚 BỘ THẺ CỦA BẠN                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │Card 1│  │Card 2│  │Card 3│  │Card 4│     │
│  └──────┘  └──────┘  └──────┘  └──────┘     │
├──────────────────────────────────────────────┤
│  [◀ Prev]  Card 1/10  [Next ▶]  [🔀 Shuffle] │
└──────────────────────────────────────────────┘
```

---

## 📊 Cấu Trúc Dữ Liệu

### Schema Flashcard

```json
{
  "id": "unique-card-id",
  "imageUrl": "/uploads/apple.jpg",
  "vocabulary": {
    "word": "Apple",
    "phonetic": "/ˈæp.əl/",
    "partOfSpeech": "noun",
    "vietnamese": "Quả táo",
    "synonyms": ["fruit"],
    "example": {
      "english": "I eat an apple every day.",
      "vietnamese": "Tôi ăn một quả táo mỗi ngày."
    }
  },
  "category": "Fruits",
  "difficulty": "easy",
  "createdAt": "2024-12-13T00:00:00Z",
  "isLearned": false,
  "reviewCount": 0
}
```

---

## 🎮 Chế Độ Học Tập

### 1. Chế Độ Duyệt (Browse Mode)
- Xem tất cả flashcard
- Lật thẻ tự do
- Đánh dấu đã học/chưa học

### 2. Chế Độ Học (Study Mode)
- Hiển thị từng thẻ một
- Tự đánh giá mức độ nhớ
- Spaced Repetition (lặp lại ngắt quãng)

### 3. Chế Độ Kiểm Tra (Quiz Mode)
- Hiển thị hình ảnh → Chọn từ đúng
- Hiển thị từ → Chọn hình đúng
- Tính điểm và theo dõi tiến độ

---

## 🔊 Tính Năng Bổ Sung

### Text-to-Speech (Phát âm)
- Phát âm từ vựng bằng giọng native
- Hỗ trợ UK/US English
- Tốc độ phát âm điều chỉnh được

### Xuất/Nhập Dữ Liệu
- Export flashcard ra JSON/CSV
- Import từ file có sẵn
- Chia sẻ bộ thẻ với người khác

### Thống Kê Học Tập
- Số thẻ đã học hôm nay
- Tỷ lệ nhớ đúng
- Biểu đồ tiến độ theo thời gian

---

## 🛠️ Công Nghệ Đề Xuất

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | React/Vue.js + CSS3 Animations |
| Backend | Node.js/Python Flask |
| AI/ML | Google Vision API / OpenAI GPT-4V |
| Database | MongoDB / PostgreSQL |
| Storage | AWS S3 / Cloudinary |
| Text-to-Speech | Web Speech API / Google TTS |

---

## 📱 Responsive Design

- **Desktop**: Grid 4 cột, thẻ lớn 300x400px
- **Tablet**: Grid 2 cột, thẻ vừa 250x350px
- **Mobile**: Grid 1 cột, thẻ full-width, swipe để chuyển

---

## 🎨 Theme & Customization

### Màu Sắc Theo Chủ Đề
- 🍎 **Fruits**: Xanh lá + Cam
- 🐾 **Animals**: Nâu + Be
- 🚗 **Vehicles**: Xanh dương + Xám
- 🏠 **Household**: Ấm áp + Gỗ

### Tùy Chỉnh Thẻ
- Chọn màu nền thẻ
- Chọn font chữ
- Thêm ghi chú cá nhân

---

## ✅ Checklist Phát Triển

- [ ] Thiết kế UI/UX mockup
- [ ] Xây dựng component Upload hình ảnh
- [ ] Tích hợp AI nhận diện hình ảnh
- [ ] Phát triển Flashcard với flip animation
- [ ] Tạo các chế độ học tập
- [ ] Thêm tính năng Text-to-Speech
- [ ] Responsive cho mobile
- [ ] Testing và optimize performance
- [ ] Deploy lên production

---

## 📌 Ghi Chú

> **Lưu ý**: Hệ thống nên có khả năng hoạt động offline sau khi đã tải xong flashcard, cho phép người dùng học mọi lúc mọi nơi.

---

*Tạo bởi: AI Assistant*
*Ngày: 13/12/2024*
