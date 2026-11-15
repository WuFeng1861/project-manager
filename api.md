# 项目管理系统 API 文档

## 基础信息

- 基础URL: `http://localhost:5666`
- 线上地址: `https://wufeng98.cn/projectManagerApi`
- 所有响应格式均为 JSON
- 时间格式: ISO 8601 (例如: `2023-10-12T10:30:00Z`)

## 统一响应格式

所有接口都使用统一的响应格式：

```json
{
  "code": 200,      // HTTP 状态码
  "data": {},       // 响应数据，错误时为 null
  "message": "",    // 响应消息
  "success": true   // 请求是否成功
}
```

## 认证

管理端接口使用「管理员账号 + 密码」登录后签发的会话令牌，不再使用单一的共享口令。

- 登录接口返回 `token`，后续请求放入请求头：`Authorization: Bearer <token>`
- 令牌默认有效期 7 天（`ADMIN_SESSION_TTL_HOURS` 可调），服务端只保存令牌的 SHA-256 摘要
- 管理员账号口令使用 scrypt 加盐哈希后存入 SQLite，**不保存明文**
- 修改账号或密码后，除当前会话外的其它会话立即失效

> 旧版的 `admin-password` / `adminPassword` 已废弃，不再具备任何管理员权限。

## 接口列表

### 一、管理员（/admin）

#### 1.1 查询初始化状态

- **接口**: `GET /admin/status`
- **描述**: 前端用来判断是否需要弹出"首次设置管理员账号"
- **认证**: 无
- **响应**:
```json
{ "code": 200, "data": { "initialized": false }, "message": "Success", "success": true }
```

#### 1.2 首次初始化管理员账号

- **接口**: `POST /admin/setup`
- **描述**: 仅在库中还没有管理员凭据时可用；初始化成功后该入口永久关闭（返回 409）
- **认证**: 无（可选 `SETUP_ALLOWED_IPS` 限制来源 IP）
- **请求体**:
```json
{ "username": "admin", "password": "Admin@12345" }
```
- **约束**: 账号 3-32 字符且不含空格；密码 8-128 字符
- **响应**: 直接返回登录令牌
```json
{
  "code": 201,
  "data": { "token": "…64位十六进制…", "expiresAt": "2026-11-22T00:00:00.000Z", "username": "admin" },
  "message": "Success",
  "success": true
}
```

#### 1.3 登录

- **接口**: `POST /admin/login`
- **请求体**:
```json
{ "username": "admin", "password": "Admin@12345" }
```
- **响应**: 同 1.2
- **失败**: `401 账号或密码错误`；同一 IP 10 分钟内失败 8 次会锁定 10 分钟并返回 `429`

#### 1.4 退出登录

- **接口**: `POST /admin/logout`
- **认证**: 需要令牌（销毁当前会话）

#### 1.5 当前管理员信息

- **接口**: `GET /admin/profile`
- **认证**: 需要令牌
- **响应**:
```json
{ "code": 200, "data": { "username": "admin", "createdAt": "…", "passwordUpdatedAt": "…" }, "message": "Success", "success": true }
```

#### 1.6 修改账号 / 密码

- **接口**: `PUT /admin/credentials`
- **认证**: 需要令牌
- **请求体**（`username`、`newPassword` 至少填一个）:
```json
{ "currentPassword": "Admin@12345", "username": "wfadmin", "newPassword": "NewPass@123" }
```
- **响应**:
```json
{
  "code": 200,
  "data": { "username": "wfadmin", "changedUsername": true, "changedPassword": true, "revokedSessions": 1 },
  "message": "Success",
  "success": true
}
```
- **失败**: 当前密码错误 → `401`；新密码与旧密码相同 → `400`

#### 1.7 黑名单

- **GET** `/admin/blocked-ips`：当前生效的黑名单
- **POST** `/admin/blocked-ips`：手动拉黑
```json
{ "ip": "203.0.113.9", "durationHours": 24, "reason": "恶意请求" }
```
  - `durationHours` 留空时取 `RATE_LIMIT_BLOCK_MS`（默认 24 小时）
  - 若该 IP 在白名单中会返回 `400`，需先移出白名单
- **DELETE** `/admin/blocked-ips/{ip}`：解除拉黑

#### 1.8 上报白名单

- **GET** `/admin/whitelist`：白名单列表
- **POST** `/admin/whitelist`：加入白名单（若该 IP 在黑名单中，会同时解除拉黑）
```json
{ "ip": "203.0.113.9", "note": "项目A 服务器" }
```
- **DELETE** `/admin/whitelist/{ip}`：移出白名单（移出后该 IP 再次上报会被拦截并拉黑）

### 二、项目（/projects）

#### 2.1 上传/更新项目信息

- **接口**: `POST /projects`
- **描述**: 上传或更新项目信息，如果项目已存在（根据 serviceName 判断）则更新，不存在则创建；同时把本次请求涉及的 IP 追加到 `sourceIps`
- **白名单校验**: 只有白名单内的来源 IP 可以上报
  - 非白名单 IP：本次上报被拦截（403），并把该 IP 写入黑名单，原因记为「非项目成员」
  - 已被拉黑的 IP：直接 403
- **请求体**:
```json
{
  "serviceName": "api-test1",
  "serverIp": "192.168.1.1",
  "servicePort": 8080,
  "serviceNotes": "测试",
  "serviceRuntime": 3600,
  "serviceDescription": "测试测试测试",
  "lastRestartTime": "2023-10-12T10:30:00Z",
  "projectPassword": "test1"
}
```
- **403 响应示例**:
```json
{
  "code": 403,
  "data": null,
  "message": "IP 203.0.113.9 不在项目白名单内，本次上报已拦截，并已将该 IP 加入黑名单（原因：非项目成员）",
  "success": false
}
```

#### 2.2 获取所有项目信息

- **接口**: `GET /projects`
- **描述**: 获取所有项目的信息和状态
- **认证**: 可选。带 `Authorization: Bearer <token>` 时返回完整 IP 与项目口令；否则 IP 脱敏且不返回 `projectPassword`
- **响应**（未登录视角）:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "serviceName": "api-gateway",
      "serverIp": "192.*.*.1",
      "sourceIp": "203.0.113.9",
      "sourceIps": ["203.0.113.9", "10.0.0.5", "192.168.1.7"],
      "servicePort": 8080,
      "serviceNotes": "主要API网关",
      "serviceRuntime": 3600,
      "serviceDescription": "用于路由请求到微服务",
      "lastRestartTime": "2023-10-12T10:30:00Z",
      "createdAt": "2023-10-12T10:30:00Z",
      "updatedAt": "2023-10-12T10:30:00Z"
    }
  ],
  "message": "Success",
  "success": true
}
```

#### 2.3 获取单个项目信息

- **接口**: `GET /projects/{serviceName}`
- **认证**: 可选，同上

#### 2.4 重启项目服务

- **接口**: `POST /projects/restart`
- **认证**: 需要令牌
- **请求体**:
```json
{ "serviceName": "api-gateway" }
```

#### 2.5 删除项目

- **接口**: `DELETE /projects`
- **认证**: 需要令牌
- **请求体**:
```json
["api-gateway", "user-service"]
```

#### 2.6 清空项目 IP 记录

- **接口**: `DELETE /projects/{serviceName}/ip-history`
- **认证**: 需要令牌

#### 2.7 暂停邮件通知（邮件里的按钮用）

- **接口**: `GET /projects/pause?projectName=xxx&time=24`
- **认证**: 无（邮件链接直接调用）

### 三、频率限制

- 系统按 IP 统计请求频率，默认每个 IP 每分钟正常上限为 30 次
- 超过正常上限的 10 倍（默认 300 次/分钟）时，该 IP 会被直接加入黑名单
- 黑名单默认持续 24 小时，期间请求返回 403；触发限制的那次请求返回 429
- 携带有效管理员令牌的请求不参与限流
- `/admin/*` 路径不因黑名单被拦截（否则管理员无法进入后台自救），但仍受令牌与登录失败锁定保护
- 可通过环境变量调整：`RATE_LIMIT_NORMAL_MAX`、`RATE_LIMIT_WINDOW_MS`、`RATE_LIMIT_BLACKLIST_MULTIPLIER`、`RATE_LIMIT_BLOCK_MS`

## 错误码说明

- 400: 请求参数错误
- 401: 未登录 / 令牌过期 / 账号或密码错误
- 403: IP 不在白名单、或已被列入黑名单
- 404: 资源不存在
- 409: 管理员账号已初始化（重复调用 `/admin/setup`）
- 429: 请求过于频繁 / 登录失败次数过多
- 500: 服务器内部错误

## 注意事项

1. 所有时间字段均使用 ISO 8601 格式
2. 非管理员访问时，服务器 IP 会被部分隐藏，且不下发 `projectPassword`
3. `sourceIps` 累计记录调用 `POST /projects` 时出现的所有 IP（原始客户端 → 各级代理 → 直连地址），自动去重、只增不减；管理员可通过 `DELETE /projects/{serviceName}/ip-history` 手动清空。`sourceIp` 为最近一次请求的原始客户端 IP
4. 项目密码用于项目重启验证，请妥善保管
5. 服务运行时间（serviceRuntime）单位为秒
6. 白名单首次启动会自动播种：`127.0.0.1` + 环境变量 `IP_WHITELIST` + 现有 `project` 表里出现过的上报来源 IP（可用 `WHITELIST_SEED_FROM_PROJECTS=false` 关闭最后一项）
