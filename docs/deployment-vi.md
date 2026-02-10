# Triển khai

Hướng dẫn này bao gồm việc triển khai Next.js Starter Kit lên môi trường production sử dụng **Firebase** cho các dịch vụ backend và **Cloudflare Pages** để hosting trang web tĩnh, với **GitHub Actions** cho CI/CD tự động.

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Thiết lập Firebase](#thiết-lập-firebase)
3. [Thiết lập Cloudflare Pages](#thiết-lập-cloudflare-pages)
4. [GitHub Actions CI/CD](#github-actions-cicd)
5. [Biến môi trường](#biến-môi-trường)

## Tổng quan

Pipeline triển khai gồm ba phần:

| Thành phần | Mục đích |
|-----------|---------|
| **Firebase** | Xác thực, cơ sở dữ liệu Firestore và security rules |
| **Cloudflare Pages** | Hosting trang web tĩnh với CDN toàn cầu |
| **GitHub Actions** | Tự động build, test và deploy khi push |

```
Developer → Push lên GitHub → GitHub Actions → Build → Deploy lên Cloudflare Pages
```

## Thiết lập Firebase

### 1. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Nhấn **Add project** và làm theo hướng dẫn
3. Bật **Google Analytics** nếu cần (dùng cho module Analytics)

### 2. Bật Authentication

1. Đi đến **Authentication** → **Sign-in method**
2. Bật các provider cần thiết:
   - **Email/Password** — bắt buộc cho đăng nhập/đăng ký bằng email
   - **Google** — bắt buộc cho chức năng "Tiếp tục với Google"
3. Trong **Authorized domains**, thêm domain production (ví dụ: `yourdomain.com`)

### 3. Tạo Firestore Database

1. Đi đến **Firestore Database** → **Create database**
2. Chọn region gần người dùng
3. Bắt đầu ở **production mode** (rules sẽ được deploy riêng)

### 4. Lấy Firebase Client Configuration

1. Đi đến **Project settings** → **General**
2. Trong **Your apps**, nhấn biểu tượng **Web** (`</>`) để đăng ký web app
3. Sao chép đối tượng cấu hình Firebase dưới dạng chuỗi JSON:

```json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "...",
  "measurementId": "..."
}
```

4. Toàn bộ đối tượng JSON này được lưu trong một biến môi trường duy nhất `NEXT_PUBLIC_FIREBASE_CONFIG` (xem [Biến môi trường](#biến-môi-trường))

### 5. Deploy Firestore Security Rules

Firestore security rules nằm trong file `firestore.rules` ở thư mục gốc. Deploy thủ công qua [Firebase Console](https://console.firebase.google.com/):

1. Đi đến **Firestore Database** → **Rules**
2. Sao chép nội dung file `firestore.rules` vào editor
3. Nhấn **Publish**

> **Lưu ý**: Security rules hiếm khi thay đổi nên deploy thủ công qua console là đủ.

## Thiết lập Cloudflare Pages

[Cloudflare Pages](https://pages.cloudflare.com/) hosting trang Next.js export tĩnh với CDN toàn cầu, HTTPS tự động và deploy nhanh.

### 1. Tạo tài khoản Cloudflare

1. Đăng ký tại [cloudflare.com](https://www.cloudflare.com/)
2. Đi đến **Workers & Pages** trong dashboard

### 2. Tạo Pages Project

1. Nhấn **Create application** → **Pages** → **Connect to Git**
2. Chọn GitHub repository của bạn
3. Cấu hình build settings:

| Cài đặt | Giá trị |
|---------|-------|
| **Framework preset** | `Next.js (Static Export)` |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |

> **Lưu ý**: Nếu Next.js app dùng `output: "export"` trong `next.config.ts`, thư mục output là `out`. Nếu dùng server mode mặc định với `@cloudflare/next-on-pages`, tham khảo [hướng dẫn Next.js on Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/) của Cloudflare.

### 3. Tên miền tùy chỉnh (Tùy chọn)

1. Đi đến **Custom domains** trong Pages project
2. Thêm tên miền (ví dụ: `yourdomain.com`)
3. Làm theo hướng dẫn cấu hình DNS

## GitHub Actions CI/CD

GitHub Actions tự động hóa build, test và deploy mỗi lần push. Project bao gồm CI workflows cho cả nhánh `main` và `develop`.

### Tổng quan Workflow

| Workflow | Kích hoạt | Mục đích |
|----------|---------|---------|
| `ci-main.yml` | Push vào `main` | Lint, test, build — pipeline production |
| `ci-develop.yml` | Push vào `develop` | Lint, test, build — pipeline development |
| `ci-pull-requests.yml` | Pull requests | Lint, test — kiểm tra PR |

### GitHub Secrets cần thiết

Thêm secrets trong repository tại **Settings** → **Secrets and variables** → **Actions**:

| Secret | Mô tả |
|--------|-------------|
| `NEXT_PUBLIC_FIREBASE_CONFIG` | Firebase web config JSON (xem [Thiết lập Firebase](#4-lấy-firebase-client-configuration)) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (cho Pages deployment) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

> **Lưu ý**: Bạn **không** cần thêm biến môi trường trong Cloudflare Pages dashboard. Secret `NEXT_PUBLIC_FIREBASE_CONFIG` được inject trong bước build của GitHub Actions, nên các giá trị được nhúng vào trang tĩnh tại thời điểm build.

### Ví dụ bước Deploy

Để deploy lên Cloudflare Pages từ GitHub Actions, thêm bước deploy vào workflow:

```yaml
- name: Deploy to Cloudflare Pages
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy out --project-name=your-project-name
```

## Biến môi trường

Cấu hình Firebase được cung cấp qua một biến môi trường duy nhất chứa toàn bộ web config dưới dạng chuỗi JSON.

| Biến | Mô tả | Ví dụ |
|----------|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_CONFIG` | Firebase web config JSON | `{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"...","measurementId":"..."}` |

Biến này có tiền tố `NEXT_PUBLIC_` nên được nhúng vào trang tĩnh tại thời điểm build.

### Phát triển local

Để phát triển local, sao chép `.env.development` và điền giá trị:

```bash
cp .env.development .env.local
```

Sửa `.env.local` với cấu hình Firebase config JSON. File này được git-ignore và an toàn cho secrets local.

### Production

Cho production builds, thiết lập `NEXT_PUBLIC_FIREBASE_CONFIG` làm **GitHub Actions secret**. Giá trị được inject tại thời điểm build và nhúng vào output tĩnh — không cần cấu hình thêm trong Cloudflare Pages.
