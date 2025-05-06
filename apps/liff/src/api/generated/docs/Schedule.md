# Schedule


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Schedule ID | [readonly] [default to undefined]
**title** | **string** |  | [default to undefined]
**description** | **string** |  | [optional] [default to undefined]
**status** | **string** |  | [default to undefined]
**createdBy** | **string** | User ID | [readonly] [default to undefined]
**groupId** | **string** |  | [optional] [default to undefined]
**createdAt** | **string** | ISO8601形式の日時文字列 (UTC) | [default to undefined]
**updatedAt** | **string** | ISO8601形式の日時文字列 (UTC) | [default to undefined]
**candidateDates** | [**Array&lt;ScheduleCandidateDatesInner&gt;**](ScheduleCandidateDatesInner.md) |  | [optional] [default to undefined]
**confirmedDateTime** | **string** | ISO8601形式の日時文字列 (UTC) | [optional] [default to undefined]

## Example

```typescript
import { Schedule } from './api';

const instance: Schedule = {
    id,
    title,
    description,
    status,
    createdBy,
    groupId,
    createdAt,
    updatedAt,
    candidateDates,
    confirmedDateTime,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
