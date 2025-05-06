# ScheduleApi

All URIs are relative to */api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**addScheduleCandidateDates**](#addschedulecandidatedates) | **POST** /schedules/{id}/candidates | 候補日時追加|
|[**addScheduleParticipant**](#addscheduleparticipant) | **POST** /schedules/{id}/participants | スケジュールに参加者追加|
|[**addScheduleVote**](#addschedulevote) | **POST** /schedules/{id}/votes | 候補日時に投票|
|[**confirmSchedule**](#confirmschedule) | **POST** /schedules/{id}/confirm | スケジュールを確定する|
|[**createSchedule**](#createschedule) | **POST** /schedules | 新規スケジュール作成|
|[**getScheduleById**](#getschedulebyid) | **GET** /schedules/{id} | スケジュール詳細取得|

# **addScheduleCandidateDates**
> addScheduleCandidateDates(addCandidateDatesInput)


### Example

```typescript
import {
    ScheduleApi,
    Configuration,
    AddCandidateDatesInput
} from './api';

const configuration = new Configuration();
const apiInstance = new ScheduleApi(configuration);

let id: string; //Schedule ID (default to undefined)
let addCandidateDatesInput: AddCandidateDatesInput; //

const { status, data } = await apiInstance.addScheduleCandidateDates(
    id,
    addCandidateDatesInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **addCandidateDatesInput** | **AddCandidateDatesInput**|  | |
| **id** | [**string**] | Schedule ID | defaults to undefined|


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
|**204** | 候補日時追加成功 (No Content) |  -  |
|**400** | リクエストが不正 |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addScheduleParticipant**
> ScheduleParticipant addScheduleParticipant(addParticipantInput)


### Example

```typescript
import {
    ScheduleApi,
    Configuration,
    AddParticipantInput
} from './api';

const configuration = new Configuration();
const apiInstance = new ScheduleApi(configuration);

let id: string; //Schedule ID (default to undefined)
let addParticipantInput: AddParticipantInput; //

const { status, data } = await apiInstance.addScheduleParticipant(
    id,
    addParticipantInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **addParticipantInput** | **AddParticipantInput**|  | |
| **id** | [**string**] | Schedule ID | defaults to undefined|


### Return type

**ScheduleParticipant**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | 参加者追加成功 |  -  |
|**400** | リクエストが不正 |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addScheduleVote**
> addScheduleVote(voteInput)


### Example

```typescript
import {
    ScheduleApi,
    Configuration,
    VoteInput
} from './api';

const configuration = new Configuration();
const apiInstance = new ScheduleApi(configuration);

let id: string; //Schedule ID (default to undefined)
let voteInput: VoteInput; //

const { status, data } = await apiInstance.addScheduleVote(
    id,
    voteInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **voteInput** | **VoteInput**|  | |
| **id** | [**string**] | Schedule ID | defaults to undefined|


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
|**204** | 投票成功 (No Content) |  -  |
|**400** | リクエストが不正 |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **confirmSchedule**
> confirmSchedule()


### Example

```typescript
import {
    ScheduleApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ScheduleApi(configuration);

let id: string; //Schedule ID (default to undefined)

const { status, data } = await apiInstance.confirmSchedule(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Schedule ID | defaults to undefined|


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
|**204** | 確定成功 (No Content) |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createSchedule**
> Schedule createSchedule(createScheduleInput)


### Example

```typescript
import {
    ScheduleApi,
    Configuration,
    CreateScheduleInput
} from './api';

const configuration = new Configuration();
const apiInstance = new ScheduleApi(configuration);

let createScheduleInput: CreateScheduleInput; //

const { status, data } = await apiInstance.createSchedule(
    createScheduleInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createScheduleInput** | **CreateScheduleInput**|  | |


### Return type

**Schedule**

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

# **getScheduleById**
> ScheduleDetail getScheduleById()


### Example

```typescript
import {
    ScheduleApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ScheduleApi(configuration);

let id: string; //Schedule ID (default to undefined)

const { status, data } = await apiInstance.getScheduleById(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Schedule ID | defaults to undefined|


### Return type

**ScheduleDetail**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 成功 (参加者・投票情報含む) |  -  |
|**401** | 認証エラー |  -  |
|**403** | アクセス権限なし |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

