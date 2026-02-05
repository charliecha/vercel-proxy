# Vercel Edge Proxy

🌐 基于 Vercel Edge Functions 的高性能 HTTP/HTTPS 代理服务，支持流式传输和多种预设代理端点。

## ✨ 特性

- ✅ **Edge Runtime**: 运行在全球 CDN 边缘节点，低延迟
- ✅ **流式传输**: 支持 ChatGPT 等 API 的 Server-Sent Events (SSE)
- ✅ **预设端点**: Google、OpenAI 等常用服务的快捷代理
- ✅ **API Key 鉴权**: 简单但有效的访问控制
- ✅ **CORS 支持**: 自动注入跨域响应头
- ✅ **TypeScript**: 完整的类型安全

## 🚀 快速开始

### 1. 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/vercel-proxy)

或使用 Vercel CLI：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 2. 配置环境变量

在 Vercel 项目设置中添加环境变量：

```env
PROXY_API_KEY=sk-proxy-your-secure-random-key-here
```

> 💡 **生成安全密钥**: 访问 [randomkeygen.com](https://randomkeygen.com/) 或使用：
> ```bash
> openssl rand -base64 32
> ```

### 3. 本地开发

```bash
# 克隆项目
git clone <your-repo-url>
cd vercel-proxy

# 安装依赖
npm install

# 创建 .env.local 文件
cp .env.example .env.local
# 编辑 .env.local 并设置 PROXY_API_KEY

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`

## 🧪 测试

我们提供了一个自动化测试脚本，可以快速验证代理服务的功能：

```bash
# 给予执行权限
chmod +x scripts/test-proxy.sh

# 运行测试 (自动从 .env 中读取 PROXY_API_KEY，默认测试 http://localhost:3000)
./scripts/test-proxy.sh

# 测试特定域名和 Key
./scripts/test-proxy.sh https://your-domain.vercel.app your-api-key
```

该脚本将自动尝试从当前目录的 `.env` 文件或环境变量 `PROXY_API_KEY` 中读取密钥。

该脚本将测试：
- 基础 GET 代理
- 带 Body 的 POST 代理
- 预设端点 (Google)
- 鉴权逻辑 (缺失或错误的 API Key)

## 📖 API 使用

### 认证

所有请求必须包含 `X-API-Key` 请求头：

```bash
curl -H "X-API-Key: sk-proxy-your-key" \
  https://your-domain.vercel.app/api/proxy?url=https://example.com
```

### 端点说明

#### 1️⃣ 通用代理端点

**路径**: `/api/proxy?url=<目标URL>`

**支持方法**: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`

**示例**：

```bash
# GET 请求
curl -H "X-API-Key: your-key" \
  "https://your-domain.vercel.app/api/proxy?url=https://api.github.com/users/github"

# POST 请求
curl -X POST \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}' \
  "https://your-domain.vercel.app/api/proxy?url=https://example.com/api"
```

#### 2️⃣ Google 代理

**路径**: `/api/proxy/google/<路径>`

**示例**：

```bash
# Google 搜索
curl -H "X-API-Key: your-key" \
  "https://your-domain.vercel.app/api/proxy/google/search?q=hello+world"
```

#### 3️⃣ OpenAI/ChatGPT 代理

**路径**: `/api/proxy/openai/<路径>`

**示例**：

```bash
# ChatGPT API (流式响应)
curl -X POST \
  -H "X-API-Key: your-proxy-key" \
  -H "Authorization: Bearer sk-your-openai-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }' \
  "https://your-domain.vercel.app/api/proxy/openai/v1/chat/completions"
```

### JavaScript/TypeScript 示例

```typescript
// 通用代理
const response = await fetch(
  'https://your-domain.vercel.app/api/proxy?url=https://api.github.com/users/github',
  {
    headers: {
      'X-API-Key': 'your-key',
    },
  }
);
const data = await response.json();

// OpenAI 流式响应
const response = await fetch(
  'https://your-domain.vercel.app/api/proxy/openai/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'your-proxy-key',
      'Authorization': 'Bearer sk-your-openai-key',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello!' }],
      stream: true,
    }),
  }
);

// 处理流式响应
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log(chunk);
}
```

## 🔒 安全建议

1. **保护 API Key**: 
   - 不要在客户端代码中硬编码 API Key
   - 使用环境变量或后端中间层

2. **速率限制**: 
   - Vercel 免费计划有带宽限制（100GB/月）
   - 考虑在应用层添加速率限制逻辑

3. **域名白名单** (可选):
   - 在 `src/lib/proxy-utils.ts` 中添加允许的目标域名列表

## ⚙️ 技术栈

- **Next.js 15+** - App Router
- **TypeScript** - 完整类型支持
- **Edge Runtime** - V8 Isolates，全球低延迟
- **Tailwind CSS** - 样式框架（已配置）

## 📁 项目结构

```
vercel-proxy/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── proxy/
│   │           ├── route.ts              # 通用代理端点
│   │           ├── google/[...path]/     # Google 预设
│   │           └── openai/[...path]/     # OpenAI 预设
│   ├── lib/
│   │   └── proxy-utils.ts                # 工具函数
│   └── middleware.ts                     # 鉴权中间件
├── .env.example                          # 环境变量模板
├── vercel.json                           # Vercel 配置
└── package.json
```

## 🛠️ 进阶配置

### 添加自定义预设代理

在 `src/app/api/proxy/` 下创建新的动态路由：

```typescript
// src/app/api/proxy/custom/[...path]/route.ts
import { NextRequest } from 'next/server';
import { forwardHeaders, addCorsHeaders } from '@/lib/proxy-utils';

export const runtime = 'edge';
const BASE_URL = 'https://your-custom-api.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetUrl = new URL(`${BASE_URL}/${path.join('/')}`);
  
  const response = await fetch(targetUrl.toString(), {
    headers: forwardHeaders(request),
  });
  
  return addCorsHeaders(new Response(response.body, response));
}
```

### 禁用鉴权（仅用于开发）

在 `.env.local` 中设置：

```env
PROXY_API_KEY=
```

⚠️ **警告**: 生产环境必须启用鉴权！

## 📝 FAQ

**Q: 为什么选择 Edge Functions 而不是 Serverless Functions？**

A: Edge Functions 在全球 CDN 运行，启动速度更快（冷启动 <10ms），更适合代理场景。

**Q: 支持 WebSocket 吗？**

A: Edge Runtime 原生不支持 WebSocket，但可以用 Server-Sent Events (SSE) 替代大多数流式场景。

**Q: Vercel 免费计划有什么限制？**

A: 
- 带宽: 100GB/月
- Serverless 函数执行时间: 10s (Edge 无此限制)
- 请求体大小: 4.5MB

**Q: 如何监控使用情况？**

A: 在 Vercel Dashboard 查看分析数据，或使用 `console.log` 在边缘日志中记录。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Built with ❤️ using Vercel Edge Functions**
