# WarikanProjectDetail


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
**members** | [**Array&lt;WarikanMember&gt;**](WarikanMember.md) |  | [default to undefined]
**payments** | [**Array&lt;WarikanPayment&gt;**](WarikanPayment.md) |  | [default to undefined]

## Example

```typescript
import { WarikanProjectDetail } from './api';

const instance: WarikanProjectDetail = {
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
    members,
    payments,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
