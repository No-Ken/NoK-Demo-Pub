# WarikanProject


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Project ID | [readonly] [default to undefined]
**projectName** | **string** |  | [default to undefined]
**status** | **string** |  | [default to undefined]
**createdBy** | **string** | User ID | [readonly] [default to undefined]
**groupId** | **string** |  | [optional] [default to undefined]
**shareUrlToken** | **string** |  | [optional] [readonly] [default to undefined]
**createdAt** | **string** | ISO8601形式の日時文字列 (UTC) | [default to undefined]
**updatedAt** | **string** | ISO8601形式の日時文字列 (UTC) | [default to undefined]
**totalAmount** | **number** |  | [readonly] [default to undefined]
**memberCount** | **number** |  | [readonly] [default to undefined]

## Example

```typescript
import { WarikanProject } from './api';

const instance: WarikanProject = {
    id,
    projectName,
    status,
    createdBy,
    groupId,
    shareUrlToken,
    createdAt,
    updatedAt,
    totalAmount,
    memberCount,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
