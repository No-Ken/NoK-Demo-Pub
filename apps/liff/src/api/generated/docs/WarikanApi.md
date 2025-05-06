# WarikanApi

All URIs are relative to */api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**addWarikanMember**](#addwarikanmember) | **POST** /warikan/projects/{id}/members | 割り勘プロジェクトにメンバー追加|
|[**addWarikanPayment**](#addwarikanpayment) | **POST** /warikan/projects/{id}/payments | 支払い記録追加|
|[**createWarikanProject**](#createwarikanproject) | **POST** /warikan/projects | 新規割り勘プロジェクト作成|
|[**getWarikanProjectById**](#getwarikanprojectbyid) | **GET** /warikan/projects/{id} | 割り勘プロジェクト詳細取得|
|[**getWarikanSettlements**](#getwarikansettlements) | **GET** /warikan/projects/{id}/settlements | 精算結果取得|
|[**listWarikanPayments**](#listwarikanpayments) | **GET** /warikan/projects/{id}/payments | 支払い記録一覧取得|
|[**settleWarikanProject**](#settlewarikanproject) | **POST** /warikan/projects/{id}/settle | プロジェクトを精算済みにする|

# **addWarikanMember**
> WarikanMember addWarikanMember(addMemberInput)


### Example

```typescript
import {
    WarikanApi,
    Configuration,
    AddMemberInput
} from './api';

const configuration = new Configuration();
const apiInstance = new WarikanApi(configuration);

let id: string; //Project ID (default to undefined)
let addMemberInput: AddMemberInput; //

const { status, data } = await apiInstance.addWarikanMember(
    id,
    addMemberInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **addMemberInput** | **AddMemberInput**|  | |
| **id** | [**string**] | Project ID | defaults to undefined|


### Return type

**WarikanMember**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | メンバー追加成功 |  -  |
|**400** | リクエストが不正 |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addWarikanPayment**
> AddWarikanPayment201Response addWarikanPayment(addPaymentInput)


### Example

```typescript
import {
    WarikanApi,
    Configuration,
    AddPaymentInput
} from './api';

const configuration = new Configuration();
const apiInstance = new WarikanApi(configuration);

let id: string; //Project ID (default to undefined)
let addPaymentInput: AddPaymentInput; //

const { status, data } = await apiInstance.addWarikanPayment(
    id,
    addPaymentInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **addPaymentInput** | **AddPaymentInput**|  | |
| **id** | [**string**] | Project ID | defaults to undefined|


### Return type

**AddWarikanPayment201Response**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | 支払い追加成功 |  -  |
|**400** | リクエストが不正 |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createWarikanProject**
> WarikanProject createWarikanProject(createProjectInput)


### Example

```typescript
import {
    WarikanApi,
    Configuration,
    CreateProjectInput
} from './api';

const configuration = new Configuration();
const apiInstance = new WarikanApi(configuration);

let createProjectInput: CreateProjectInput; //

const { status, data } = await apiInstance.createWarikanProject(
    createProjectInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createProjectInput** | **CreateProjectInput**|  | |


### Return type

**WarikanProject**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | 作成成功 |  -  |
|**400** | リクエストが不正 |  -  |
|**401** | 認証エラー |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getWarikanProjectById**
> WarikanProjectDetail getWarikanProjectById()


### Example

```typescript
import {
    WarikanApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WarikanApi(configuration);

let id: string; //Project ID (default to undefined)

const { status, data } = await apiInstance.getWarikanProjectById(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Project ID | defaults to undefined|


### Return type

**WarikanProjectDetail**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 成功 (メンバー・支払い情報含む) |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getWarikanSettlements**
> Array<WarikanSettlement> getWarikanSettlements()


### Example

```typescript
import {
    WarikanApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WarikanApi(configuration);

let id: string; //Project ID (default to undefined)

const { status, data } = await apiInstance.getWarikanSettlements(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Project ID | defaults to undefined|


### Return type

**Array<WarikanSettlement>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 成功 |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listWarikanPayments**
> Array<WarikanPayment> listWarikanPayments()


### Example

```typescript
import {
    WarikanApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WarikanApi(configuration);

let id: string; //Project ID (default to undefined)

const { status, data } = await apiInstance.listWarikanPayments(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Project ID | defaults to undefined|


### Return type

**Array<WarikanPayment>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 成功 |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **settleWarikanProject**
> WarikanProject settleWarikanProject()


### Example

```typescript
import {
    WarikanApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WarikanApi(configuration);

let id: string; //Project ID (default to undefined)

const { status, data } = await apiInstance.settleWarikanProject(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Project ID | defaults to undefined|


### Return type

**WarikanProject**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 精算完了 |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

