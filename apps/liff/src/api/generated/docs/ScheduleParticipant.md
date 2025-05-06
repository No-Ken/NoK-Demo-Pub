# ScheduleParticipant


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Participant ID (Doc ID) | [readonly] [default to undefined]
**scheduleId** | **string** | Parent Schedule ID | [readonly] [default to undefined]
**isGuest** | **boolean** |  | [readonly] [default to undefined]
**lineUserId** | **string** |  | [optional] [readonly] [default to undefined]
**displayName** | **string** |  | [default to undefined]
**addedAt** | **string** | ISO8601形式の日時文字列 (UTC) | [default to undefined]

## Example

```typescript
import { ScheduleParticipant } from './api';

const instance: ScheduleParticipant = {
    id,
    scheduleId,
    isGuest,
    lineUserId,
    displayName,
    addedAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
