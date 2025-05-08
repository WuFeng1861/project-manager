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
- 管理员密码: `wufeng1998`
- 传递方式: 
  - Query参数: `?adminPassword=wufeng1998`
  - 或 Header: `admin-password: wufeng1998`

## 接口列表

### 1. 上传/更新项目信息

- **接口**: `POST /projects`
- **描述**: 上传或更新项目信息，如果项目已存在（根据serviceName判断）则更新，不存在则创建
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
- **请求头**: `admin-password: wufeng1998`
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
- **请求头**: `admin-password: wufeng1998`
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

## 错误码说明

- 400: 请求参数错误
- 401: 未授权（管理员密码错误）
- 404: 资源不存在
- 500: 服务器内部错误

## 注意事项

1. 所有时间字段均使用 ISO 8601 格式
2. 非管理员访问时，IP 地址会被部分隐藏
3. 项目密码用于项目重启验证，请妥善保管
4. 服务运行时间（serviceRuntime）单位为秒
