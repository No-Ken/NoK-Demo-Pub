# SharedMemoApi

All URIs are relative to */api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**archiveSharedMemo**](#archivesharedmemo) | **DELETE** /shared-memos/{id} | Archive (soft delete) a shared memo|
|[**createSharedMemo**](#createsharedmemo) | **POST** /shared-memos | Create a shared memo|
|[**getSharedMemoById**](#getsharedmemobyid) | **GET** /shared-memos/{id} | Get a shared memo by ID|
|[**listSharedMemos**](#listsharedmemos) | **GET** /shared-memos | List accessible shared memos (pagination)|
|[**updateSharedMemo**](#updatesharedmemo) | **PATCH** /shared-memos/{id} | Update a shared memo|

# **archiveSharedMemo**
> archiveSharedMemo()


### Example

```typescript
import {
    SharedMemoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SharedMemoApi(configuration);

let id: string; //Shared Memo ID (default to undefined)

const { status, data } = await apiInstance.archiveSharedMemo(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Shared Memo ID | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | 成功（返却データなし） |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createSharedMemo**
> SharedMemo createSharedMemo(createSharedMemoInput)


### Example

```typescript
import {
    SharedMemoApi,
    Configuration,
    CreateSharedMemoInput
} from './api';

const configuration = new Configuration();
const apiInstance = new SharedMemoApi(configuration);

let createSharedMemoInput: CreateSharedMemoInput; //

const { status, data } = await apiInstance.createSharedMemo(
    createSharedMemoInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createSharedMemoInput** | **CreateSharedMemoInput**|  | |


### Return type

**SharedMemo**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Shared memo created |  -  |
|**400** | リクエストが不正 |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSharedMemoById**
> SharedMemo getSharedMemoById()


### Example

```typescript
import {
    SharedMemoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SharedMemoApi(configuration);

let id: string; //Shared Memo ID (default to undefined)

const { status, data } = await apiInstance.getSharedMemoById(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Shared Memo ID | defaults to undefined|


### Return type

**SharedMemo**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listSharedMemos**
> ListSharedMemosResponse listSharedMemos()


### Example

```typescript
import {
    SharedMemoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SharedMemoApi(configuration);

let limit: number; //Max number of memos to return (optional) (default to 20)
let cursor: string; //Cursor for pagination (last memo ID from previous page) (optional) (default to undefined)

const { status, data } = await apiInstance.listSharedMemos(
    limit,
    cursor
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **limit** | [**number**] | Max number of memos to return | (optional) defaults to 20|
| **cursor** | [**string**] | Cursor for pagination (last memo ID from previous page) | (optional) defaults to undefined|


### Return type

**ListSharedMemosResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | リクエストが不正 |  -  |
|**401** | 認証エラー |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateSharedMemo**
> updateSharedMemo(updateSharedMemoInput)


### Example

```typescript
import {
    SharedMemoApi,
    Configuration,
    UpdateSharedMemoInput
} from './api';

const configuration = new Configuration();
const apiInstance = new SharedMemoApi(configuration);

let id: string; //Shared Memo ID (default to undefined)
let updateSharedMemoInput: UpdateSharedMemoInput; //

const { status, data } = await apiInstance.updateSharedMemo(
    id,
    updateSharedMemoInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateSharedMemoInput** | **UpdateSharedMemoInput**|  | |
| **id** | [**string**] | Shared Memo ID | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | 成功（返却データなし） |  -  |
|**400** | リクエストが不正 |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

