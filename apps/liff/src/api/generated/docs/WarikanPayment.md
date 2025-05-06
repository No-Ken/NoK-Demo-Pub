# WarikanPayment


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Payment ID | [readonly] [default to undefined]
**projectId** | **string** | Parent Project ID | [readonly] [default to undefined]
**payerMemberId** | **string** | 支払者のメンバーID | [default to undefined]
**amount** | **number** |  | [default to undefined]
**description** | **string** |  | [optional] [default to undefined]
**paymentDate** | **string** | ISO8601形式の日時文字列 (UTC) | [optional] [default to undefined]
**createdAt** | **string** | ISO8601形式の日時文字列 (UTC) | [default to undefined]
**participants** | **Array&lt;string&gt;** |  | [optional] [default to undefined]

## Example

```typescript
import { WarikanPayment } from './api';

const instance: WarikanPayment = {
    id,
    projectId,
    payerMemberId,
    amount,
    description,
    paymentDate,
    createdAt,
    participants,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
