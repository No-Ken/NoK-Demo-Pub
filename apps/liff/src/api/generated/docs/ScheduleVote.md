# ScheduleVote


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Vote ID (Doc ID) | [readonly] [default to undefined]
**scheduleId** | **string** | Parent Schedule ID | [readonly] [default to undefined]
**optionId** | **string** |  | [default to undefined]
**participantId** | **string** |  | [default to undefined]
**vote** | **string** |  | [default to undefined]
**comment** | **string** |  | [optional] [default to undefined]
**votedAt** | **string** | ISO8601形式の日時文字列 (UTC) | [default to undefined]

## Example

```typescript
import { ScheduleVote } from './api';

const instance: ScheduleVote = {
    id,
    scheduleId,
    optionId,
    participantId,
    vote,
    comment,
    votedAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
