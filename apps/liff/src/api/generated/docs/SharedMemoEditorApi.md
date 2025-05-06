# SharedMemoEditorApi

All URIs are relative to */api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**addSharedMemoEditor**](#addsharedmemoeditor) | **POST** /shared-memos/{id}/editors | Add an editor to a shared memo|
|[**removeSharedMemoEditor**](#removesharedmemoeditor) | **DELETE** /shared-memos/{id}/editors/{editorId} | Remove an editor from a shared memo|

# **addSharedMemoEditor**
> addSharedMemoEditor(addEditorInput)


### Example

```typescript
import {
    SharedMemoEditorApi,
    Configuration,
    AddEditorInput
} from './api';

const configuration = new Configuration();
const apiInstance = new SharedMemoEditorApi(configuration);

let id: string; //Shared Memo ID (default to undefined)
let addEditorInput: AddEditorInput; //

const { status, data } = await apiInstance.addSharedMemoEditor(
    id,
    addEditorInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **addEditorInput** | **AddEditorInput**|  | |
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

# **removeSharedMemoEditor**
> removeSharedMemoEditor()


### Example

```typescript
import {
    SharedMemoEditorApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SharedMemoEditorApi(configuration);

let id: string; //Shared Memo ID (default to undefined)
let editorId: string; //Editor User ID to remove (default to undefined)

const { status, data } = await apiInstance.removeSharedMemoEditor(
    id,
    editorId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Shared Memo ID | defaults to undefined|
| **editorId** | [**string**] | Editor User ID to remove | defaults to undefined|


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

