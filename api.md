# 项目管理系统 API 文档

## 基础信息

- 基础URL: `http://localhost:5666`
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

### 成功响应示例

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "serviceName": "api-gateway",
    "serverIp": "192.168.1.1"
  },
  "message": "Success",
  "success": true
}
```

### 错误响应示例

```json
{
  "code": 400,
  "data": null,
  "message": "服务名称不能为空",
  "success": false
}
```

## 认证

部分接口需要管理员密码验证：
- 管理员密码来自环境变量 `SERVER_PASSWORD`
- 传递方式: 
  - Query参数: `?adminPassword=<管理员密码>`
  - 或 Header: `admin-password: <管理员密码>`

## 接口列表

### 1. 上传/更新项目信息

- **接口**: `POST /projects`
- **描述**: 上传或更新项目信息，如果项目已存在（根据serviceName判断）则更新，不存在则创建；同时把本次请求涉及的 IP 追加到 `sourceIps`
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
- **响应**: 
```json
{
  "code": 201,
  "data": {
    "id": 1,
    "serviceName": "api-gateway",
    "serverIp": "192.168.1.1",
    "sourceIp": "203.0.113.9",
    "sourceIps": ["203.0.113.9", "10.0.0.5", "192.168.1.7"],
    "servicePort": 8080,
    "serviceNotes": "主要API网关",
    "serviceRuntime": 3600,
    "serviceDescription": "用于路由请求到微服务",
    "lastRestartTime": "2023-10-12T10:30:00Z",
    "createdAt": "2023-10-12T10:30:00Z",
    "updatedAt": "2023-10-12T10:30:00Z"
  },
  "message": "Success",
  "success": true
}
```

### 2. 获取所有项目信息

- **接口**: `GET /projects`
- **描述**: 获取所有项目的信息和状态
- **参数**: 
  - `adminPassword` (可选): 管理员密码，用于显示完整IP
- **响应**: 
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

### 3. 获取单个项目信息

- **接口**: `GET /projects/{serviceName}`
- **描述**: 获取指定项目的详细信息
- **参数**:
  - `serviceName`: 项目服务名称
  - `adminPassword` (可选): 管理员密码
- **响应**:
```json
{
  "code": 200,
  "data": {
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
  },
  "message": "Success",
  "success": true
}
```

### 4. 重启项目服务

- **接口**: `POST /projects/restart`
- **描述**: 重启指定的项目服务
- **认证**: 需要管理员密码
- **请求头**: `admin-password: <管理员密码>`
- **请求体**:
```json
{
  "serviceName": "api-gateway"
}
```
- **响应**:
```json
{
  "code": 200,
  "data": {
    "success": true,
    "message": "Project restarted successfully"
  },
  "message": "Success",
  "success": true
}
```

### 5. 删除项目

- **接口**: `DELETE /projects`
- **描述**: 删除一个或多个项目
- **认证**: 需要管理员密码
- **请求头**: `admin-password: <管理员密码>`
- **请求体**:
```json
[
  "api-gateway",
  "user-service"
]
```
- **响应**:
```json
{
  "code": 200,
  "data": {
    "success": true,
    "message": "成功删除 2 个项目"
  },
  "message": "Success",
  "success": true
}
```

### 6. 清空项目 IP 记录

- **接口**: `DELETE /projects/{serviceName}/ip-history`
- **描述**: 清空指定项目累计记录的 `sourceIps`，不影响项目其他信息
- **认证**: 需要管理员密码
- **请求头**: `admin-password: <管理员密码>`
- **响应**:
```json
{
  "code": 200,
  "data": {
    "success": true,
    "message": "已清空 api-gateway 的 IP 记录"
  },
  "message": "Success",
  "success": true
}
```

### 7. 请求频率限制与黑名单

- 系统按 IP 统计请求频率，默认每个 IP 每分钟正常上限为 30 次
- 超过正常上限的 10 倍（默认 300 次/分钟）时，该 IP 会被直接加入黑名单
- 黑名单默认持续 24 小时，期间请求返回 403；触发限制的那次请求返回 429
- 携带正确管理员密码的请求不参与限流，避免管理员被误封
- 可通过环境变量调整：`RATE_LIMIT_NORMAL_MAX`、`RATE_LIMIT_WINDOW_MS`、`RATE_LIMIT_BLACKLIST_MULTIPLIER`、`RATE_LIMIT_BLOCK_MS`

黑名单管理接口（需要管理员密码，Header `admin-password` 或 Query `adminPassword`）：

- **GET** `/projects/blocked-ips`：获取当前生效的黑名单
- **POST** `/projects/blocked-ips`：手动将 IP 加入黑名单
  ```json
  {
    "ip": "203.0.113.9",
    "durationHours": 24,
    "reason": "恶意请求"
  }
  ```
  - `ip`：必填，IPv4 或 IPv6
  - `durationHours`：可选，封禁时长（小时），默认取 `RATE_LIMIT_BLOCK_MS`（24 小时）
  - `reason`：可选，加入黑名单的原因，默认“管理员手动加入黑名单”
  - 响应：
  ```json
  {
    "success": true,
    "message": "已将 203.0.113.9 加入黑名单",
    "ip": "203.0.113.9",
    "blockedUntil": "2023-10-13T10:30:00.000Z"
  }
  ```
- **DELETE** `/projects/blocked-ips/{ip}`：解除指定 IP 的黑名单

## 错误码说明

- 400: 请求参数错误
- 401: 未授权（管理员密码错误）
- 403: IP 已被列入黑名单
- 404: 资源不存在
- 429: 请求过于频繁，已触发黑名单
- 500: 服务器内部错误

## 注意事项

1. 所有时间字段均使用 ISO 8601 格式
2. 非管理员访问时，IP 地址会被部分隐藏
3. `sourceIps` 累计记录调用 `POST /projects` 时出现的所有 IP（原始客户端 → 各级代理 → 直连地址），自动去重、只增不减；管理员可通过 `DELETE /projects/{serviceName}/ip-history` 手动清空。`sourceIp` 为最近一次请求的原始客户端 IP
4. 项目密码用于项目重启验证，请妥善保管
5. 服务运行时间（serviceRuntime）单位为秒
